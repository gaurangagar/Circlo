import User from "../models/user.model.js";

export const generateUsername = async (base) => {
  let username = base.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!username) username = "user";

  let finalUsername = username;
  let counter = 0;

  while (await User.findOne({ username: finalUsername })) {
    counter++;
    finalUsername = `${username}${counter}`;
  }

  return finalUsername;
};