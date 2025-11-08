const express = require('express');
const router = express.Router();

const controller = require('../controllers/org.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);


router.post('/', controller.createOrganization);
router.get('/', controller.getMyOrganizations);
router.get('/:orgId', controller.getOrganizationDetails);
router.get('/:orgId/dashboard', controller.getDashboardOverview);


router.post('/:orgId/members', controller.addMemberToOrg);
router.put('/:orgId/members/:userId', controller.updateMemberRole);
router.delete('/:orgId/members/:userId', controller.removeMemberFromOrg);


router.get('/:orgId/alerts', controller.getAlertsForOrg);
router.get('/:orgId/quick-links', controller.getQuickLinks);
router.post('/:orgId/quick-links', controller.addQuickLink);

// Invitation routes
const invitationController = require('../controllers/invitation.controller');
router.post('/:orgId/invite', invitationController.inviteUserToOrg);

module.exports = router;
