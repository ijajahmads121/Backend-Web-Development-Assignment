const prisma = require('../db/prisma');

function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

function create(data) {
  return prisma.user.create({ data });
}

module.exports = { findByEmail, create };
