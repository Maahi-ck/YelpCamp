
const Joi = require('joi');

module.exports.CampgroundSchema = Joi.object(
      {
            Campground: Joi.object({
                  title: Joi.string().required(),
                  price: Joi.number().required().min(0),
                  description: Joi.string().required(),
                  location: Joi.string().required(),
                  images: Joi.array().items(Joi.string()).required()

            }).required()
      }
);

module.exports.ReviewSchema = Joi.object({
      Review: Joi.object({
            body: Joi.string().required(),
            rating: Joi.number().required().min(0).max(5)
      }).required()
});

module.exports.UserSchema = Joi.object({
      user: Joi.object(
            {
                  username: Joi.string()
                        .pattern(/^[a-zA-Z0-9._]+$/)
                        .min(3)
                        .max(15)
                        .required()
                        .messages({
                              'string.pattern.base': 'Username can only include letters, numbers, dots, and underscores.',
                              'string.min': 'Username must be at least 3 characters long.',
                              'string.max': 'Username must be at most 15 characters long.',
                              'any.required': 'Username is required.'
                        })
                  ,
                  password: Joi.string().required(),
                  email: Joi.string()
                        .email({ tlds: { allow: false } })
                        .required()
                        .messages({
                              'string.email': 'Please enter a valid email address.',
                              'any.required': 'Email is required.'
                        })
            }
      ).required()
});

module.exports.HostSchema = Joi.object({
      host: Joi.object(
            {
                  hostname: Joi.string().required(),
                  password: Joi.string().required()
            }
      ).required()
})

module.exports.AdminSchema = Joi.object({
      admin: Joi.object(
            {
                  adminname: Joi.string().required(),
                  password: Joi.string().required()
            }
      ).required()
})