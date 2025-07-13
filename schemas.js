const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': 'Dont include HTML in input!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value });
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension);
 
module.exports.CampgroundSchema = Joi.object({
    Campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().required().min(0),
        description: Joi.string().required().escapeHTML(),
        location: Joi.string().required().escapeHTML(),
        images: Joi.array().items(Joi.string()).required()
    }).required()
});

module.exports.ReviewSchema = Joi.object({
    Review: Joi.object({
        body: Joi.string().required().escapeHTML(),
        rating: Joi.number().required().min(0).max(5)
    }).required()
});

module.exports.UserSchema = Joi.object({
    user: Joi.object({
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
            .escapeHTML(),
        password: Joi.string().required().escapeHTML(),
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .required()
            .messages({
                'string.email': 'Please enter a valid email address.',
                'any.required': 'Email is required.'
            })
            .escapeHTML()
    }).required()
});

module.exports.HostSchema = Joi.object({
    host: Joi.object({
        hostname: Joi.string().required().escapeHTML(),
        password: Joi.string().required().escapeHTML()
    }).required()
});

module.exports.AdminSchema = Joi.object({
    admin: Joi.object({
        adminname: Joi.string().required().escapeHTML(),
        password: Joi.string().required().escapeHTML()
    }).required()
});
