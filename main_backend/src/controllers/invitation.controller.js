const prisma = require('../prismaClient');
const { sendInvitationEmail } = require('../utils/emailService');

const inviteUserToOrg = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }

        // Check if organization exists
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                memberships: {
                    include: { user: true }
                }
            }
        });

        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Check if user has permission to invite
        const userMembership = org.memberships.find(m => m.user.id === req.user.id);
        if (!userMembership || (userMembership.role !== 'ADMIN' && userMembership.role !== 'SUB_ADMIN')) {
            return res.status(403).json({ error: 'You do not have permission to invite members' });
        }

        // Check if user is already a member
        const existingMember = org.memberships.find(m => m.user.email.toLowerCase() === email.toLowerCase());
        if (existingMember) {
            return res.status(400).json({ error: 'User is already a member of this organization' });
        }

        // Create invitation
        const invitation = await prisma.invitation.create({
            data: {
                email: email.toLowerCase(),
                role,
                organizationId: orgId,
                inviterId: req.user.id,
                status: 'PENDING',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            }
        });

        // Get inviter details
        const inviter = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Send invitation email
        const emailSent = await sendInvitationEmail(invitation, org, inviter);

        if (!emailSent) {
            // If email fails, delete the invitation and return error
            await prisma.invitation.delete({
                where: { id: invitation.id }
            });
            return res.status(500).json({ error: 'Failed to send invitation email' });
        }

        return res.status(201).json({
            message: 'Invitation sent successfully',
            invitation
        });
    } catch (error) {
        console.error('Error inviting user:', error);
        return res.status(500).json({ error: 'Failed to send invitation' });
    }
};

module.exports = {
    inviteUserToOrg
};