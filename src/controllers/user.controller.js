import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
    const user = await User.findById(userId)
    if (!user) throw new ApiError(404, 'User not found')

    const accessToken = user.generateAccessToken();
    const refreshToken = user.refreshAccessToken();

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    console.log('ACCESS TOKEN TYPE:', typeof accessToken)
    console.log('REFRESH TOKEN TYPE:', typeof refreshToken)

    return { accessToken, refreshToken }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body

    // if (firstname === '') {
    //     throw new ApiError(400, 'fullname is required')
    // }

    if ([fullName, email, username, password].some((field) => field?.trim() === '')) {
        throw new ApiError(400, 'all fields are important')
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, 'User already exists')
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    if (!avatar) {
        throw new ApiError(400, 'Avatar is required')
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select('-password -refreshToken')

    if (!createdUser) {
        throw new ApiError(500, 'something went wrong while registering')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'Registration Successful')
    )

})

const loginUser = asyncHandler(async (req, res) => {


    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, 'username or email is required')
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, 'user does not exist')
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid password')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User
        .findById(user._id)
        .select('-password -refreshToken')

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    }

    console.log('ACCESS TOKEN TYPE:', typeof accessToken)      // must be "string"
    console.log('ACCESS TOKEN VALUE:', accessToken)            // must look like a JWT: xxxx.yyyy.zzzz
    console.log('REFRESH TOKEN TYPE:', typeof refreshToken)    // must be "string"
    console.log('REFRESH TOKEN VALUE:', refreshToken)          // must look like a JWT


    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser },
                'User logged in successfully'
            )
        )

})


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        { new: true }
    )
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(
            new ApiResponse(
                200,
                {},
                'User logged out successfully'
            )
        )

})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (incomingRefreshToken) {
        throw new ApiError(401, 'unauthorized request')
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, 'Invalid Refresh Token')
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token expired')
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie('accessToken', accessToken)
            .cookie('refreshToken', newRefreshToken)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    'Access Token Refreshed'
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token')
    }
})




export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}