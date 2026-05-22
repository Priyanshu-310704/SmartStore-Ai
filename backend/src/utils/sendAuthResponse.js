const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = user.createToken();

  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      storeName: user.storeName,
    },
  });
};

module.exports = sendAuthResponse;
