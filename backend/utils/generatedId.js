// Simple reusable ID generator

exports.generateId = () => {
  return Math.floor(100 + Math.random() * 90000);
};