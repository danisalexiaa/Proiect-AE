import bcrypt from 'bcryptjs';
import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';
import User from '../models/userModel.js';
import { generateToken, isAdmin, isAuth } from '../utils.js';

const userRouter = express.Router();

userRouter.get('/seed', 
expressAsyncHandler (async (req, res)=>{
    await User.remove({});
    const createdUsers = await User.insertMany(data.users);
    res.send({createdUsers});
}));

userRouter.post('/signin', expressAsyncHandler(async(req, res)=>{
    const user = await User.findOne({email: req.body.email});
    if(user){
        if(bcrypt.compareSync(req.body.password, user.password)){
            res.send({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                token: generateToken(user)
            });
            return;
        }
    }
    res.status(401).send({message: "Invalid email/password"});
}));

userRouter.post('/register', expressAsyncHandler(async(req, res)=>{
    const user = new User({name: req.body.name, email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8)
});
const createdUser = await user.save();
res.send({ _id: createdUser._id,
    name: createdUser.name,
    email: createdUser.email,
    isAdmin: createdUser.isAdmin,
    token: generateToken(createdUser),
});
}));

userRouter.get('/:id', expressAsyncHandler(async(req, res) => {
    const user = await User.findById(req.params.id);
    if(user){
        res.send(user);
    }else{
        res.status(404).send({message: 'Utilizatorul nu a fost gasit.'});
    }
}));

userRouter.put('/profile', isAuth, expressAsyncHandler(async(req, res) => {
    const user = await User.findById(req.user._id);
    if(user){
        user.name = req.body.name || user.name;
        user.mail = req.body.mail || user.mail;
        if(req.body.password){
            user.password = bcrypt.hashSync(req.body.password, 8);
        }
        const updateUser = await user.save();
        res.send({
            _id: updateUser._id,
            name: updateUser.name,
            mail: updateUser.mail,
            isAdmin: updateUser.isAdmin,
            token: generateToken(updateUser),
        });
    }
}));

userRouter.get('/', isAuth, isAdmin, expressAsyncHandler(async(req, res) => {
    const users = await User.find({});
    res.send(users);
}));

userRouter.delete('/:id', isAuth, isAdmin, expressAsyncHandler(async(req, res) => {
    const user = await User.findById(req.params.id);
    if(user){
        if(user.email === 'admin@example.com'){
            res.status(400).send({message: 'Nu se poate sterge Adminul'});
            return;
        }
        const deleteUser = await user.remove();
        res.send({message: 'Userul a fost sters', user: deleteUser});
    }
    else{
        res.send(404).send({message: 'Userul nu a fost gasit'});
    }
}));

userRouter.put('/:id', isAuth, isAdmin, expressAsyncHandler(async(req, res)=>{
    const user = await User.findById(req.params.id);
    if(user){
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.isAdmin = req.body.isAdmin || user.isAdmin;
        const updatedUser = await user.save();
        res.send({message: "User updatat", user: updatedUser})
    }
    else{
        res.status(404).send({message: 'Userul nu a fost gasit'});
    }
}));

export default userRouter;

