function getDateRange(query) {
  const days = Math.min(Number(query.days) || 30, 365);
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - days * 86400000);

  return { from, to };
}

module.exports = getDateRange;
