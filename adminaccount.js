const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { AdminUser } = require('../models');
const yup = require("yup");
const { sign } = require('jsonwebtoken');
const { validateToken } = require('../middlewares/auth');


require('dotenv').config();

router.post("/register", async (req, res) => {
    let data = req.body;
    // Validate request body
    let validationSchema = yup.object({
        secretCode: yup
            .string()
            .oneOf(["BikeHub2023"], 'Invalid secret code')
            .required('Secret code is required.'),
        name: yup
            .string()
            .trim()
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name must be at most 50 characters')
            .required('Name is required.'),
        adminID: yup
            .string()
            .trim()
            .matches(/^(\d{6}[A-Z])$/, 'Admin ID should be in the format eg. 111111A')
            .required('Admin ID is required.'),
        email: yup
            .string()
            .email()
            .required('Email is required.'),
        role: yup.string().required('Description of role is required.'),
        password: yup.string().trim().min(8).max(50).required()
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
    data.secretCode = data.secretCode.trim();
    data.name = data.name.trim();
    data.adminID = data.adminID.trim();
    data.email = data.email.trim();
    data.role = data.role.trim();
    data.password = data.password.trim();

    // Check admin email
    let adminuser = await AdminUser.findOne({
        where: { email: data.email }
    });
    if (adminuser) {
        res.status(400).json({ message: "Admin email already exists." });
        return;
    }
    //Hash secret code
    data.secretCode = await bcrypt.hash(data.secretCode, 10);

    // Hash passowrd
    data.password = await bcrypt.hash(data.password, 10);
    // Create admin user
    let result = await AdminUser.create(data);
    res.json(result);
});


router.post("/login", async (req, res) => {
    let data = req.body;
    // Trim string values
    data.email = data.email.trim();
    data.password = data.password.trim();

    // Check admin ID and password
    let errorMsg = "Email or password is not correct.";
    let adminuser = await AdminUser.findOne({
        where: { email: data.email }
    });
    if (!adminuser) {
        res.status(400).json({ message: errorMsg });
        return;
    }
    let match = await bcrypt.compare(data.password, adminuser.password);
    if (!match) {
        res.status(400).json({ message: errorMsg });
        return;
    }
    // Return user info
    let adminuserInfo = {
        id: adminuser.id,
        adminID: adminuser.adminID,
        email: adminuser.email,
        name: adminuser.name,
        role: adminuser.role,
    };
    let accessToken = sign(adminuserInfo, process.env.APP_SECRET);
    res.json({
        accessToken: accessToken,
        adminuser: adminuserInfo
    });
});



router.get("/", async (req, res) => {
    let condition = {};
    let search = req.query.search;
    if (search) {
        condition[Sequelize.Op.or] = [
            { adminID: { [Sequelize.Op.like]: `%${search}%` } },
            { name: { [Sequelize.Op.like]: `%${search}%` } },
            { email: { [Sequelize.Op.like]: `%${search}%` } },
            { role: { [Sequelize.Op.like]: `%${search}%` } }
        ];
    }
    let list = await AdminUser.findAll({
        where: condition,
        order: [['createdAt', 'DESC']]
    });
    res.json(list);
});



router.get("/:id", async (req, res) => {
    let id = req.params.id;
    let adminuser = await AdminUser.findByPk(id);
    // Check id not found
    if (!adminuser) {
        res.sendStatus(404);
        return;
    }
    res.json(adminuser);
});


router.get("/auth", validateToken, (req, res) => {
    let adminuserInfo = {
        id: req.adminuser.id,
        adminID: req.adminuser.adminID,
        name: req.adminuser.name,
        role: req.adminuser.role
    };
    res.json({
        adminuser: adminuserInfo
    });
});


router.put("/:id", async (req, res) => {
    let id = req.params.id;

    // Check id not found
    let adminuser = await AdminUser.findByPk(id);
    if (!adminuser) {
        res.sendStatus(404);
        return;
    }

    let data = req.body;
    // Validate request body
    let validationSchema = yup.object({
        secretCode: yup
            .string()
            .oneOf(["BikeHub2023"], 'Invalid secret code')
            .required('Secret code is required.'),
        name: yup
            .string()
            .trim()
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name must be at most 50 characters')
            .required('Name is required.'),
        adminID: yup
            .string()
            .trim()
            .matches(/^(\d{6}[A-Z])$/, 'Admin ID should be in the format eg. 111111A')
            .required('Admin ID is required.'),
        email: yup
            .string()
            .email('Invalid email address')
            .required('Email is required.'),
        role: yup.string().required('Description of role is required.')
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
    data.secretCode = data.secretCode.trim();
    data.name = data.name.trim();
    data.adminID = data.adminID.trim();
    data.email = data.email.trim();
    data.role = data.role.trim();

    //Hash secret code
    data.secretCode = await bcrypt.hash(data.secretCode, 10);

    // Hash passowrd
    data.password = await bcrypt.hash(data.password, 10);

    let num = await AdminUser.update(data, {
        where: { id: id }
    });
    if (num == 1) {
        res.json({
            message: "Details was updated successfully."
        });
    }
    else {
        res.status(400).json({
            message: `Cannot update details with id ${id}.`
        });
    }
});

router.delete("/:id", async (req, res) => {
    let id = req.params.id;
    let num = await AdminUser.destroy({
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
