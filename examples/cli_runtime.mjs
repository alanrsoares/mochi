// Runtime helper for Mochi CLI example router
export const getArg = () => process.argv[2] || "";
export const log = (msg) => {
  console.log(msg);
  return 0;
};
