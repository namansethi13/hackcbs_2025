const prisma = require('../prismaClient');

exports.getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });
    console.log(`Found ${users.length} users`);

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || null,
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    }));

    res.status(200).json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Could not fetch users', details: error.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch profile' });
  }
};

exports.updateMyProfile = async (req, res) => {
  const { name } = req.body;
  try {
    if (typeof name === 'undefined') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name || null },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Could not update profile' });
  }
};
