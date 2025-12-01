// Artillery helper functions for load testing

module.exports = {
  // Generate unique user data for signup
  generateUserData: function (context, events, done) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    context.vars.testEmail = `loadtest_${timestamp}_${random}@test.com`;
    context.vars.testUsername = `loadtest_${timestamp}_${random}`;
    context.vars.testPassword = "TestPassword123!";
    context.vars.testDisplayName = context.vars.testUsername;
    return done();
  },

  // Generate unique post data
  generatePostData: function (context, events, done) {
    const random = Math.random().toString(36).substring(2, 8);
    context.vars.postCaption = `Load test post ${random}`;
    context.vars.postLocation = `Test Location ${random}`;
    return done();
  },
};
