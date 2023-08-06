const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const asyncHandler = require('express-async-handler')

const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body
    // console.log(username)
    //all data is present
    if (!username || !password) {
        return res.status(400).json({ message: "All fields required" })
    }
    //username exists and is active
    const foundUser = await User.findOne({ username }).exec()
    if (!foundUser || !foundUser.active) {
        return res.status(401).json({ message: "User is not present or active" })
    }
    //is the password correct
    const match = await bcrypt.compare(password, foundUser.password)

    if (!match) {
        return res.status(401).json({ message: "Wrong password" })
    }

    const accessToken = jwt.sign({
        "userInfo": {
            "username": foundUser.username,
            "roles": foundUser.roles
        }
    },
        process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    }
    )
    const refreshToken = jwt.sign(
        {
            "username": foundUser.username
        }
        ,
        process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    }
    )
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000 //set to match refresh token age
    })

    res.json({ accessToken })
})
const refresh = asyncHandler(async (req, res) => {
    const cookies = req.cookies
    console.log(cookies, 'cookies')
    if (!cookies?.jwt) {
        return res.status(401).json({ message: "Unauthorized" })
    }
    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: err.message })
            }
            const foundUser = await User.findOne({ username: decoded.username }).exec()
            if (!foundUser) {
                return res.status(401).json({ message: 'UnAuthorized' })
            }
            const accessToken = jwt.sign({
                "UserInfo": {
                    "username": foundUser.username,
                    "roles": foundUser.roles
                }
            }, process.env.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: '15m'
                })
            res.json({ accessToken })
        })
    )
})
const logout = asyncHandler(async (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) {
        return res.sendStatus(204)
    }
    res.json({ message: "cookies cleared" })
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    })
})
module.exports = { login, refresh, logout }