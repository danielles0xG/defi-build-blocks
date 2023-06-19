"use-strict";
function _logTx(name, tx) {
  try {
    if (tx.hash) console.log(name, " tx hash : ", tx.hash);
  } catch (err) {
    console.log(name, " : ", err);
  }
}

module.exports = {
  _logTx,
};
