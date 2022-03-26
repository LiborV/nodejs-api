const path = require('path')
const ErrorResponse = require('../utils/errorResponse')
const Bootcamp = require('../models/Bootcamps')
const geocoder = require('../utils/geocoder')
const asyncHandler = require('../middleware/async')

// @desc        Get all bootcamps
// @route       GET api/v1/bootcamps
// @access      Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults)
})

// @desc        Get single bootcamps
// @route       GET api/v1/bootcamps/:id
// @access      Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)

    // bootcamp je naformátovaný sprvně ale neni v databázi
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`
            , 404))
    }

    res.status(200).json({
        success: true,
        data: bootcamp
    })
})

// @desc        Create bootcamp
// @route       POST api/v1/bootcamps
// @access      Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    // req.user.id -> má přístup k user, protože má v modelu tohle [dfsdfsdf]
    req.body.user = req.user.id

    // Check for published bootcamp // prože každý user můžem mít jeden bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })

    // If the user is not an admin, they can only add one an bootcamp
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(new ErrorResponse(`The uesr with ID  ${req.user.id} has already published a bootcamp`, 401))
    }

    const bootcamp = await Bootcamp.create(req.body)
    res.status(201).json({
        success: true,
        data: bootcamp
    })
})

// @desc        Update bootcamp
// @route       PUT api/v1/bootcamps/:id
// @access      Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    let bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(new ErrorResponse(
            `Bootcamp not found with id of ${req.params.id}`
            , 404)
        )
    }

    // Make sure user is bootcampe owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(
            `User ${req.params.id} is not authorized to update this bootcamp`,
            401)
        )
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        success: true,
        data: bootcamp
    })
})

// @desc        DELETE bootcamp
// @route       DELETE api/v1/bootcamps/:id
// @access      Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id)
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`
            , 404))
    }

    // Make sure user is bootcampe owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(
            `User ${req.params.id} is not authorized to delete this bootcamp`,
            401)
        )
    }

    bootcamp.remove()

    res.status(200).json({
        success: true,
        data: {}
    })
})

// @desc        GET bootcamps within a radius
// @route       DELETE api/v1/bootcamps/radius/:zipcode/:distance
// @access      Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params

    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude
    const lng = loc[0].longitude


    // Calc radius using radians
    // Divide dist by radius of Earth
    // Earth Radius  = 3.963mi / 6.378 km
    const radius = distance / 3963

    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    })

    res.status(200).json({
        results: true,
        count: bootcamps.length,
        data: bootcamps
    })
})

// @desc        Upload photo fot bootcamp
// @route       UPDATE api/v1/bootcamps/:id/photo
// @access      Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`
            , 404))
    }

    // Make sure user is bootcampe owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(
            `User ${req.params.id} is not authorized to update this bootcamp`,
            401)
        )
    }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload file`, 400))
    }

    const file = req.files.file

    // Make sure the iage is a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 400))
    }

    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload an image less then
            ${process.env.MAX_FILE_UPLOAD}`, 400))
    }

    // Metoda path.parse() vrací objekt, jehož vlastnosti představují významné prvky cesty.
    // Create custom filename
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.log(err)
            return next(new ErrorResponse(`Problem with upload file`, 500))
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })

        res.status(200).json({
            success: true,
            data: file.name
        })
    })
})
