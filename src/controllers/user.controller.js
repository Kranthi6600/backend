import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse, apiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body
    console.log('email: ', email)

    // if (firstname === '') {
    //     throw new ApiError(400, 'fullname is required')
    // }

    if ([fullname, email, username, password].some((field) => field?.trim() === '')) {
        throw new ApiError(400, 'all fields are important')
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, 'User already exists')
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, 'Avatar is required')
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || '',
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select('-password -refreshToken')

    if (!createdUser) {
        throw new ApiError(500, 'something went wrong while registering')
    }

    return res.status(201).join(
        new ApiResponse(200, createdUser, 'Registration Successful')
    )
})

export { registerUser }