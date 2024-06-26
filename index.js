var express = require('express')
var ejs = require('ejs');
var mysql = require('mysql')
var session = require('express-session');


mysql.createConnection({
    host: "localhost",
    user:"root",
    password: "",
    database: "node_project"
});


var bodyParser = require('body-parser');
var app = express();

app.use(express.static('public'));
app.set('view engine','ejs');


app.listen(8080);

app.use(bodyParser.urlencoded({extended:true}));

app.use(session({secret:"secret",saveUninitialized: false,}))

function isProductInCart(cart,id){

    for(let i=0;i<cart.lenght;i++){
        if(cart[i].id == id){
            return true;
        }

        return false;

    }
}

function calculateTotal(cart,req){
    total =0;
    for(let i=0;i<cart.length;i++){
        if(cart[i].sale_price){
            total = total +(cart[i].sale_price*cart[i].quantity);

        }else{
            total =total + (cart[i].price*cart[i].quantity)
        }
    }
    req.session.total = total;
    return total;

}
app.get('/',(req,res)=>{

    var con=mysql.createConnection({
        host: "localhost",
        user:"root",
        password: "",
        database: "node_project"
    });

    con.query("SELECT * FROM products",(err,result)=>{
        res.render('pages/index',{result:result});
    });
    
})

// const mongoose = require('mongoose');
// const mongoDbStore = require('connect-mongo')(session);
// var url = "";
// mongoose.connect(url);
// mongoose.promise = global.promise
// var db = mongoose.connection;
// const meg_scehma = new mongoose.schema({
// 	name: {
// 		type:string,
// 		required : true;
// 	}
// 	rollnum: number
// });
// const mage = new mongoose.model("mage",mage_schemas);

// dbo.collections("customers").insertOne(obj,(err,res)={

//    })

app.post('/add_to_cart',(req,res)=>{

    var id = req.body.id;
    var name = req.body.name;
    var price = req.body.price;
    var sale_price = req.body.sale_price;
    var quantity = req.body.quantity;
    var image = req.body.image;

    var product ={ id:id,name:name,price:price,sale_price:sale_price,quantity:quantity,image:image}
    var cart;
    if(req.session.cart){
         cart = req.session.cart;

        if(!isProductInCart(cart,id)){
            cart.push(product);
        }}else{
            req.session.cart = [product];
            cart = req.session.cart;

        }
    

    // calculate total

    calculateTotal(cart,req);

    //return to cart page

    res.redirect('/cart');
});

app.get('/cart',(req,res)=>{
  
    var cart = req.session.cart;
    var total = req.session.total;

    res.render('pages/cart',{cart:cart,total:total});
});

app.post('/remove_product',(req,res)=>{
    var id = req.body.id;
    var cart = req.session.cart;

    for(let i=0;i<cart.length;i++){
        if(cart[i].id == id){
            cart.splice(cart.indexOf(i),1);
        }
    }
    calculateTotal(cart,req);
    res.redirect('/cart');

});

app.post('/edit_product_quantity',(req,res)=>{

    //get values from the input
    var id =req.body.id;
    var quantity = req.body.quantity;
    var increase_btn = req.body.increase_product_quantity;
    var decrease_btn = req.body.decrease_product_quantity;

    var cart = req.session.cart;

    if(increase_btn){
        for(let i=0;i<cart.length;i++){
            if(cart[i].id == id){
                if(cart[i].quantity > 0){
                    cart[i].quantity = parseInt(cart[i].quantity)+1;

                }
            }
        }
    }

    if(decrease_btn){
        for(let i=0;i<cart.length;i++){
            if(cart[i].id == id){
                if(cart[i].quantity > 0){
                    cart[i].quantity = parseInt(cart[i].quantity)-1;
                    
                }
            }
        }
    }

    calculateTotal(cart,req);
    res.redirect('/cart');
})

app.get('/checkout',(req,res)=>{
    var total = req.session.total;
    res.render('pages/checkout',{total:total})
})

app.post('/place_order',(req,res)=>{
    
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var city = req.body.city;
    var address = req.body.address;
    var cost = req.session.total;
    var status ="not paid";
    var date = new Date();
    var products_ids="";

    var con=mysql.createConnection({
        host: "localhost",
        user:"root",
        password: "",
        database: "node_project"
    });

    var cart = req.session.cart;
    for(let i=0;i<cart.length;i++){
        products_ids=products_ids+","+cart[i].id;

    }
    con.connect((err)=>{
        if(err){
            console.log(err);
        }else{
            var query = "INSERT INTO orders(cost,name,email,status,city,address,phone,date,products_ids) VALUES ?";
            var values = [[cost,name,email,status,city,address,phone,date,products_ids]];
            con.query(query,[values],(err,res)=>{
                res.redirect('/payment');
            })
        }
    })

})

app.get('/payment',(req,res)=>{
    res.render('pages/payment')
})