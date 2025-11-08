const prisma = require('../prismaClient');

const Roles = Object.freeze({
  ADMIN: 'ADMIN',
  SUB_ADMIN: 'SUB_ADMIN',
  MEMBER: 'MEMBER',
});

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const sanitizeUrl = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const toIsoString = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return null;
};

const checkAdminRole = async (userId, organizationId) => {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organizationId,
      role: Roles.ADMIN,
    }
  });

  return !!membership;
};

const checkMemberRole = async (userId, organizationId) => {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organizationId,
    }
  });

  return !!membership;
};

// POST /api/orgs
exports.createOrganization = async (req, res) => {
  const { name } = req.body;
  const ownerId = req.user.id;

  console.log('Creating organization:', { name, ownerId });

  if (!name) {
    return res.status(400).json({ error: 'Organization name is required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          ownerId,
        }
      });

      await tx.membership.create({
        data: {
          organizationId: org.id,
          userId: ownerId,
          role: Roles.ADMIN,
        }
      });

      return org;
    });

    console.log('Organization created successfully:', result);

    res.status(201).json({
      org: {
        id: result.id,
        name: result.name,
        ownerId: result.ownerId,
        createdAt: result.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      error: 'Could not create organization',
      details: error.message
    });
  }
};

// GET /api/orgs
exports.getMyOrganizations = async (req, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user.id },
      include: {
        organization: true,
      }
    });

    const organizations = memberships.map(membership => ({
      id: membership.organization.id,
      name: membership.organization.name,
      ownerId: membership.organization.ownerId,
      createdAt: toIsoString(membership.organization.createdAt),
      myRole: membership.role,
    }));

    res.status(200).json({ organizations });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch organizations' });
  }
};

// GET /api/orgs/:orgId/dashboard
exports.getDashboardOverview = async (req, res) => {
  const { orgId } = req.params;

  try {
    if (!(await checkMemberRole(req.user.id, orgId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const alerts = await prisma.alert.findMany({
      where: { organizationId: orgId },
      orderBy: { timestamp: 'desc' }
    });

    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      organizationId: alert.organizationId,
      severity: alert.severity,
      message: alert.message,
      timestamp: toIsoString(alert.timestamp),
    }));

    let eventStatus = 'All clear';
    if (formattedAlerts.length > 0) {
      const severity = String(formattedAlerts[0].severity || '').toLowerCase();
      if (severity === 'critical') {
        eventStatus = 'Critical alert active';
      } else if (severity === 'high') {
        eventStatus = 'Elevated alert active';
      } else if (severity === 'medium') {
        eventStatus = 'Monitoring recent activity';
      }
    }

    const now = new Date();
    const patrols = await prisma.patrol.findMany({
      where: {
        organizationId: orgId,
        scheduledAt: { gte: now }
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5
    });

    const upcomingPatrols = patrols.map(patrol => ({
      id: patrol.id,
      name: patrol.name || 'Scheduled Patrol',
      time: toIsoString(patrol.scheduledAt),
    }));

    res.status(200).json({
      eventStatus,
      upcomingPatrols,
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch dashboard overview' });
  }
};

// GET /api/orgs/:orgId
exports.getOrganizationDetails = async (req, res) => {
  const { orgId } = req.params;

  try {
    if (!(await checkMemberRole(req.user.id, orgId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const members = org.memberships.map(membership => ({
      id: membership.id,
      role: membership.role,
      joinedAt: toIsoString(membership.joinedAt),
      user: membership.user ? {
        id: membership.user.id,
        email: membership.user.email,
        name: membership.user.name || null,
      } : null,
    }));

    res.status(200).json({
      organization: {
        id: org.id,
        name: org.name,
        ownerId: org.ownerId,
        createdAt: toIsoString(org.createdAt),
        members,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch organization details' });
  }
};

// POST /api/orgs/:orgId/members
exports.addMemberToOrg = async (req, res) => {
  const { orgId } = req.params;
  const { email, role } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    if (!(await checkAdminRole(req.user.id, orgId))) {
      return res.status(403).json({ error: 'Access denied: Requires ADMIN role' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingMembership = await prisma.membership.findFirst({
      where: {
        organizationId: orgId,
        userId: user.id,
      }
    });

    if (existingMembership) {
      return res.status(409).json({ error: 'User is already a member' });
    }

    const assignedRole = Object.values(Roles).includes(role) ? role : Roles.MEMBER;

    const membership = await prisma.membership.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: assignedRole,
      }
    });

    res.status(201).json({
      membership: {
        id: membership.id,
        organizationId: membership.organizationId,
        userId: membership.userId,
        role: membership.role,
        joinedAt: toIsoString(membership.joinedAt),
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not add member' });
  }
};

// PUT /api/orgs/:orgId/members/:userId
exports.updateMemberRole = async (req, res) => {
  const { orgId, userId } = req.params;
  const { role } = req.body;

  try {
    if (!(await checkAdminRole(req.user.id, orgId))) {
      return res.status(403).json({ error: 'Access denied: Requires ADMIN role' });
    }

    if (!role || !Object.values(Roles).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        organizationId: orgId,
        userId: userId,
      }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    await prisma.membership.update({
      where: { id: membership.id },
      data: { role }
    });

    res.status(200).json({ message: 'Role updated' });
  } catch (error) {
    res.status(500).json({ error: 'Could not update role' });
  }
};

// DELETE /api/orgs/:orgId/members/:userId
exports.removeMemberFromOrg = async (req, res) => {
  const { orgId, userId } = req.params;

  try {
    if (!(await checkAdminRole(req.user.id, orgId))) {
      return res.status(403).json({ error: 'Access denied: Requires ADMIN role' });
    }

    if (req.user.id === userId) {
      return res.status(400).json({ error: 'Admin cannot remove themselves' });
    }

    await prisma.membership.deleteMany({
      where: {
        organizationId: orgId,
        userId: userId,
      }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Could not remove member' });
  }
};

// GET /api/orgs/:orgId/alerts
exports.getAlertsForOrg = async (req, res) => {
  const { orgId } = req.params;

  try {
    if (!(await checkMemberRole(req.user.id, orgId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const alerts = await prisma.alert.findMany({
      where: { organizationId: orgId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      organizationId: alert.organizationId,
      severity: alert.severity,
      message: alert.message,
      timestamp: toIsoString(alert.timestamp),
    }));

    res.status(200).json({ alerts: formattedAlerts });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch alerts' });
  }
};

// GET /api/orgs/:orgId/quick-links
exports.getQuickLinks = async (req, res) => {
  const { orgId } = req.params;

  try {
    if (!(await checkMemberRole(req.user.id, orgId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const links = await prisma.quickLink.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' }
    });

    const formattedLinks = links.map(link => ({
      id: link.id,
      label: link.label,
      url: link.url,
      organizationId: link.organizationId,
      createdBy: link.createdBy || null,
      createdAt: toIsoString(link.createdAt),
    }));

    res.status(200).json({ links: formattedLinks });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch quick links' });
  }
};

// POST /api/orgs/:orgId/quick-links
exports.addQuickLink = async (req, res) => {
  const { orgId } = req.params;
  const { label, url } = req.body;

  if (!label || !url) {
    return res.status(400).json({ error: 'Label and URL are required' });
  }

  try {
    if (!(await checkMemberRole(req.user.id, orgId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const normalizedUrl = sanitizeUrl(url);
    if (!normalizedUrl) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const link = await prisma.quickLink.create({
      data: {
        organizationId: orgId,
        label: label.trim(),
        url: normalizedUrl,
        createdBy: req.user.id,
      }
    });

    res.status(201).json({
      link: {
        id: link.id,
        organizationId: link.organizationId,
        label: link.label,
        url: link.url,
        createdBy: link.createdBy,
        createdAt: toIsoString(link.createdAt),
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not add quick link' });
  }
};
