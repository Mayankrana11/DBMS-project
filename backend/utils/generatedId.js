// now redundant db uses auto increment

exports.generateId = () => {
  return Math.floor(100 + Math.random() * 90000);
};