const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User, Sequelize } = require('../models');
const yup = require("yup");
const { sign } = require('jsonwebtoken');
const phoneRegExp = /^(\+65[ \-]*)?[689]\d{7}$/;
const { validateToken } = require('../middlewares/auth');

require('dotenv').config();

router.post("/register", async (req, res) => {
    let data = req.body;
    // Validate request body
    let validationSchema = yup.object({
        firstName: yup
          .string()
          .trim()
          .min(2, 'First name must be at least 2 characters')
          .max(50, 'First name can be at most 50 characters')
          .required('First name is required.'),
        lastName: yup
          .string()
          .trim()
          .min(2, 'Last name must be at least 2 characters')
          .max(50, 'Last name can be at most 50 characters')
          .required('Last name is required.'),
        email: yup
          .string()
          .email('Invalid email address')
          .required('Email is required.'),
        phoneNo: yup
          .string()
          .matches(phoneRegExp, 'Phone number is not valid')
          .required('Phone number is required.'),
        password: yup
          .string()
          .trim()
          .min(8, 'Password must be at least 8 characters')
          .max(50, 'Password can be at most 50 characters')
          .required('Password is required.'),
            
      });
      
    try {
        await validationSchema.validate(data,
            { abortEarly: false, strict: true });
    }
    catch (err) {
        res.status(400).json({ errors: err.errors });
        return;
    }

    // Trim string values
    data.firstName = data.firstName.trim();
    data.lastName = data.lastName.trim();
    data.phoneNo = data.phoneNo.trim();
    data.email = data.email.trim().toLowerCase();
    data.password = data.password.trim();

    

    // Check email
    let user = await User.findOne({
        where: { email: data.email }
    });
    if (user) {
        res.status(400).json({ message: "Email already exists." });
        return;
    }

    // Hash passowrd
    data.password = await bcrypt.hash(data.password, 10);
    data.userType = 'user'
    // Create user
    let result = await User.create(data);
    res.json(result);
});


router.post("/login", async (req, res) => {
    console.log("login");
    let data = req.body;
    // Trim string values
    data.email = data.email.trim().toLowerCase();
    data.password = data.password.trim();
    // Check email and password
    let errorMsg = "Email or password is not correct.";
    let user = await User.findOne({
        where: { email: data.email }
    });
    if (!user) {
        res.status(400).json({ message: errorMsg });
        return;
    }
    let match = await bcrypt.compare(data.password, user.password);
    if (!match) {
        res.status(400).json({ message: errorMsg });
        return;
    }
    // Return user info
    let userInfo = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNo: user.phoneNo
    };
    let accessToken = sign(userInfo, process.env.APP_SECRET);
    res.json({
        accessToken: accessToken,
        user: userInfo
    });
});



router.get("/", async (req, res) => {
    let condition = {};
    let search = req.query.search;
    if (search) {
        condition[Sequelize.Op.or] = [
            { firstName: { [Sequelize.Op.like]: `%${search}%` } },
            { lastName: { [Sequelize.Op.like]: `%${search}%` } },
            { email: { [Sequelize.Op.like]: `%${search}%` } },
            { phoneNo: { [Sequelize.Op.like]: `%${search}%` } },
        ];
    }
    let list = await User.findAll({
        where: condition,
        order: [['createdAt', 'DESC']]
    });
    res.json(list);
});

router.get("/auth", validateToken, (req, res) => {
    console.log("test auth");
    let userInfo = {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phoneNo: req.user.phoneNo
    };
    res.json({
        user: userInfo
    });
});

router.get("/:id", async (req, res) => {
    console.log("get by id");
    let id = req.params.id;
    let user = await User.findByPk(id);
    // Check id not found
    if (!user) {
        res.sendStatus(404);
        return;
    }
    res.json(user);
});


router.put("/:id", async (req, res) => {
    let id = req.params.id;

    // Check id not found
    let user = await User.findByPk(id);
    if (!user) {
        res.sendStatus(404);
        return;
    }

    let data = req.body;
    // Validate request body
    let validationSchema = yup.object({
        firstName: yup.string().trim().min(3).max(100).required(),
        lastName: yup.string().trim().min(3).max(500).required(),
        email: yup.string().email().required(),
        phoneNo: yup.string().matches(phoneRegExp, 'Phone number is not valid').required(),
        password: yup.string().trim().min(8).max(50).required()
    });
    try {
        await validationSchema.validate(data,
            { abortEarly: false });
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ errors: err.errors });
        return;
    }

    data.firstName = data.firstName.trim();
    data.lastName = data.lastName.trim();
    data.email = data.email.trim();
    data.phoneNo = data.phoneNo.trim();
    data.password = data.password.trim();

    let num = await User.update(data, {
        where: { id: id }
    });
    if (num == 1) {
        res.json({
            message: "Account was updated successfully."
        });
    }
    else {
        res.status(400).json({
            message: `Cannot update account with id ${id}.`
        });
    }
});

router.delete("/:id", async (req, res) => {
    let id = req.params.id;
    let num = await User.destroy({
        where: { id: id }
    })
    if (num == 1) {
        res.json({
            message: "Account was deleted successfully."
        });
    }
    else {
        res.status(400).json({
            message: `Cannot delete account with id ${id}.`
        });
    }
});

module.exports = router;
