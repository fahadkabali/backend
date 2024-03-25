const express =require("express")
const app =express()
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const path = require("path")
const cors = require("cors")
const bcrypt = require('bcrypt')
const { error } = require("console")
require('dotenv').config()
const port =5000;

app.use(express.json())
app.use(cors())

// MongonDB connection 
mongoose.connect(`${process.env.MONGODB_URI}`)
// Api creation

app.get("/",(req,res)=>{
    res.send("Express App is runinng")
})
const fs = require('fs');

const uploadDir = './upload/images';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage =multer.diskStorage({
    destination: path.resolve(__dirname, 'upload/images'),
    filename:(req,file,cb)=>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({storage:storage})
//creating upload endpoint for images

app.use('/images', express.static('upload/images'))

app.post("/upload", upload.single('product'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: 0, error: 'No file uploaded' });
        }
        // Process the uploaded file
        res.json({
            success: 1,
            image_url:`https://backend-a13v.onrender.com:${port}/images/${req.file.filename}`
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ success: 0, error: 'Internal server error' });
    }
});


// app.post("/upload",upload.single('product'),(req, res)=>{
//     res.json({
//         success:1,
//         image_url:`http://localhost:${port}/images/${req.file.filename}`
//     })
// })

//schema for creating products.
const Product = mongoose.model("Product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
        unique:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    }
})
app.post('/addproduct',async(req, res) => {
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1)
        let last_product = last_product_array[0]
        id =last_product.id +1
    }else{
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,


    })
    console.log(product)
    await product.save();
    console.log("Saved")
    res.json({
        success:true,
        name:req.body.name,
    })
})
// creating api for deleting products

app.post("/removeproduct", async(req, res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Product Removed")
    res.json({
        success:true,
        name:req.body.name,
    })
})

//creating Api for getting all products

app.get("/allproducts", async (req,res)=>{
    let products = await Product.find({})
    // console.log("All products Fetched")
    res.send(products);
});

//User model schema
const User= mongoose.model('Users',{
    name:{
        type:String,
        required: true,
        trim: true,
    },
    email:{
        type:String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password:{
        type:String,
        required: true,
        minlength: 8, 
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
        immutable: true, 
    },
})

//creating Endpoint for registration
// app.post('/signup',async (req, res)=>{
//     let existingUser = await User.findOne({email:req.body.email});
//     if (existingUser) {
//         return res.status(400).json({ message: 'Email already exists' });
//     }
//     let cart ={};
//     for(let i = 0; i<300; i++){
//         cart[i] = 0;
//     }
//     const user = new User({
//         name:req.body.username,
//         email:req.body.email,
//         password:req.body.password,
//         cartData:cart,
//     })
//     await user.save();

//     const data={
//         user:{
//             id:user.id
//         }
//     }
//     const token = jwt.sign(data, 'secret_ecom');
//     res.json({success:true,token})

// })

app.post('/signup', async (req, res) => {
    try {
        // Extract user data from request body
        const { username, email, password } = req.body
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' })
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 10); // Adjustable cost factor
        let cart ={};
        for(let i = 0; i<300; i++){
            cart[i] = 0;
        }
        // Create a new user instance with an empty cart
        const user = new User({
            name: username,
            email,
            password: hashedPassword,
            cartData: cart,
        })
        await user.save()
        const data = {
            message: 'User created successfully',
            success: true,
            token: jwt.sign({ user: { id: user.id } }, 'secret_ecom')
        }
        
        res.status(201).json(data); 
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Internal server error' })
    }
})

//creating end point for user login

// app.post('/login', async(req, res)=>{
//     try{

//         const {email, password} =req.body
//         let user = await User.findOne({email:email})
//         if(user){
//             const passCompare = password===user.password
//             if(passCompare){
//                 const data ={
//                     user:{
//                         id:user.id
//                     }
//                 }
//                 const token = jwt.sign(data, 'secret_ecom')
//                 res.json({success:true,token})
//             }
//             else{
//                 res.json({success:false,errors:"Wrong Password"})
//             }
//         }
//         else{
//             res.json({sucess:false,errors:"Wrong Email Id"})
//         }
//     }catch(err){
//         console.error(err)
//         res.status(500).json({ message: 'Internal server error' })
//     }
// })

app.post('/login', async (req, res) => {
    try {
        // Extract user data from request body
        const { email, password } = req.body;

        // Validate the request body (optional)

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare hashed password with provided password
        const isMatch = bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token with user ID
        const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom', { expiresIn: '1h' }); // Replace with appropriate expiration time

        // Send successful login response with token
        res.status(200).json({
            message: 'Login successful',
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// creating endpoint for newCollections

app.get('/newcollections',async (req, res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8)
    console.log("NewCollection Fetched")
    res.send(newcollection)

})
// creating endpoint for popular in women
app.get('/popularinwomen', async(req,res)=>{
    let  products = await Product.find({category:"women"})
    let popluar_in_women =products.slice(0,4);
    console.log("Popular in Women Fetched")
    res.send(popluar_in_women)
}) 
// creating middleware

const fetchUser = async (req, res, next) =>{
    if(!token){
        res.status(401).send({errors:"Please authenticate using valid token"})
    }
    else{
        try{
            const data = jwt.verify(token,'secret_ecom');
            req.user =data.user
            next()
        }catch(error){
            res.status(401).send({errors:"please authenticate using a valid token "})
        }
    }
}
//creating endpoint for adding products in cartData
app.post('/addtocart', fetchUser, async(req,res) =>{
    let userData = await User.findOne({_id:req.user.id})
    userData.cartData[req.body.itemId] +=1;
    await User.findByIdAndUpdate({_id:req.user.id},{cartData:userData.cartData})
    res.send("Added")
})
//creatin end point point for removing product from cart
app.post("/removeproduct",fetchUser, async (req,res)=>{

})

app.listen(port,(error)=>{
    if(!error){
        console.log(`Server Running on Port ${port}`)
    }
    else{
        console.log(`Error:${error}`)
    }
})
