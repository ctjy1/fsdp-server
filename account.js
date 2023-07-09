const express = require('express');
const router = express.Router();
const { Account, AdminAccount, Sequelize } = require('../models');
const yup = require("yup");
const phoneRegExp = /^(\+65[ \-]*)?[689]\d{7}$/;


//User accounts
router.post("/", async (req, res) => {
    let data = req.body;
    // Validate request body
    let validationSchema = yup.object({
        firstName: yup.string().trim().min(3).max(100).required(),
        lastName: yup.string().trim().min(3).max(500).required(),
        email: yup.string().email().required(),
        phoneNo: yup.string().matches(phoneRegExp, 'Phone number is not valid').required(),
        userType: yup.string().required()
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
    data.email = data.email.trim().toLowerCase();
    data.phoneNo = data.phoneNo.trim();
    data.userType = data.userType.trim();

    let result = await Account.create(data);
    res.json(result);
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
            { userType: { [Sequelize.Op.like]: `%${search}%` } }
        ];
    }
    let list = await Account.findAll({
        where: condition,
        order: [['createdAt', 'DESC']]
    });
    res.json(list);
});



router.get("/:id", async (req, res) => {
    let id = req.params.id;
    let account = await Account.findByPk(id);
    // Check id not found
    if (!account) {
        res.sendStatus(404);
        return;
    }
    res.json(account);
});


router.put("/:id", async (req, res) => {
    let id = req.params.id;

    // Check id not found
    let account = await Account.findByPk(id);
    if (!account) {
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
        userType: yup.string().required()
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
    data.userType = data.userType.trim();

    let num = await Account.update(data, {
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
    let num = await Account.destroy({
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