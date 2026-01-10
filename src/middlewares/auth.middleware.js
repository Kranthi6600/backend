import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";



// export const verifyJWT = asyncHandler(async (req, res, next) => {
//     const rawToken =
//         req.cookies?.accessToken ||
//         req.header('Authorization')?.replace(/^Bearer\s+/i, '')

//     console.log('RAW TOKEN TYPE:', typeof rawToken)
//     console.log('RAW TOKEN VALUE:', rawToken)

//     if (!rawToken || rawToken === 'undefined') {
//         throw new ApiError(401, 'Unauthorized request')
//     }

//     let decodedToken
//     try {
//         decodedToken = jwt.verify(
//             rawToken,
//             process.env.ACCESS_TOKEN_SECRET
//         )
//     } catch (err) {
//         console.error('JWT VERIFY ERROR:', err)
//         throw new ApiError(401, 'Invalid or expired access token')
//     }

//     const user = await User
//         .findById(decodedToken._id)
//         .select('-password -refreshToken')

//     if (!user) {
//         throw new ApiError(401, 'Invalid access token')
//     }

//     req.user = user
//     next()
// })


export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header('Authorization')?.split(' ')[1]

    if (!token) {
        throw new ApiError(401, 'Access token missing')
    }

    let decoded
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    } catch {
        throw new ApiError(401, 'Invalid or expired access token')
    }

    const user = await User.findById(decoded._id)
        .select('-password -refreshToken')

    if (!user) {
        throw new ApiError(401, 'User not found')
    }

    req.user = user
    next()
})
