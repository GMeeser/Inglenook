//Variables
var token = localStorage.token;
var HOST = "https://inglenookapp.co.za/api.php";
//var HOST = "http://home.meeser.co.za:900/grant/Apps/Server%20Backends/Inglenook/api.php";
//var HOST = "http://server1/grant/Apps/Server%20Backends/Inglenook/api.php";

var addToCartMax = 0;
var cart = [];
var cartTotal = 0;

var orderID = localStorage.orderID;
var requiresDeposit = true;
var deposit = 0;

var disableMenu = false;

// Wait for PhoneGap to load
document.addEventListener("deviceready", onDeviceReady, false);
$(document).ready(onDeviceReady);

// PhoneGap is ready
function onDeviceReady() {
	$("body").on("swipeleft",function(){closeMenu();});
	$("body").on("swiperight",function(){openMenu();});
	$("#addToCartContainer").hide();
	$("#menu").children().each(function(index, element) {
        $(element).click(function(){closeMenu();});
    });
	

	$('#menu_btn').removeClass('hide');
	console.log(window.location.hash);
	if(window.location.hash!='#paymentComplete'){window.location = "#homeScreen"; orderID=0;}else{
		paymentComplete();	
	}
	isLogedIn();
	$.mobile.loadingMessage = false;
	$("#login_password").keydown(function (e){if (e.keyCode == 13){$("#login_btn").click();}});
	$("#register_confirm_password").keydown(function (e){if (e.keyCode == 13){$("#register_btn").click();}});
}

function validateToken(){
	$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {"f":"validateToken","token": token},
		success: function(responseData, textStatus, jqXHR) {
				//console.log("Token Valid");
			},
		error: function (responseData, textStatus, errorThrown) {
				//console.log("Token Invalid");
				$('#menu_btn').addClass('hide');
				token=0;
				window.location = "#logIn";
			}
	});
}

function isLogedIn(){
	if(token==0){
		$('#menu_btn').addClass('hide');
		window.location = "#logIn";
	}
	validateToken();
}

function openMenu(){
	if(token!=0 && disableMenu==false){
		$("#menu").addClass('open');
	}
}

function closeMenu(){
	$("#menu").removeClass('open');
}

function arrangeHome(){
	
}

function login(){
	$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {"f":"login","email": $("#login_email").val(),"password": $("#login_password").val()},
		success: function(responseData, textStatus, jqXHR) {
			responseData = JSON.parse(responseData);
			token = responseData.token;
			if(token!=0){
				localStorage.token = token;
				window.location = "#homeScreen";
				$('#menu_btn').removeClass('hide');
				setTimeout(arrangeHome,250);
			}else{
				$("#login_msg").html(responseData.error);
			}
	    	},
		error: function (responseData, textStatus, errorThrown) {$("#login_msg").html("Connection Error, Please Try Again Later.");}
	});
}

function logout(){
	localStorage.token = 0;
	token = 0;
	$('#menu_btn').addClass('hide');
	window.location = '#logIn';
}

function isEmail(email) {
	var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	return regex.test(email);
}

function register(){
	if($("#register_password").val()!=$("#register_confirm_password").val()){
		$("#register_msg").html("Passwords Do Not Match."); 
		return "error";
	}

	if(!isEmail($("#register_email").val())){
		$("#register_msg").html("Please Enter A Valid Email Address."); 
		return "error";
	}
	if($("#register_name").val().length < 5){
		$("#register_msg").html("Name to short.");
		return "error";
	}
	if($("#register_contactNumber").val().length < 10){
		$("#register_msg").html("Please input a valid contact number.");
		return "error";
	}
	$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"register",
			"email": $("#register_email").val(),
			"password": $("#register_password").val(),
			"contactNumber": $("#register_contactNumber").val(),
			"name": $("#register_name").val()},
		success: function(responseData, textStatus, jqXHR) {
			responseData = JSON.parse(responseData);
			token = responseData.token;
			if(token!=0){
				localStorage.token = token;
				window.location = "#homeScreen";
				$('#menu_btn').removeClass('hide');
			}else{
				$("#register_msg").html(responseData.error);
			}
	    	},
		error: function (responseData, textStatus, errorThrown) {$("#register_msg").html("Connection Error, Please Try Again Later.");}
	});
}

function forgotPassword(){
		$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"forgotPassword",
			"email": $("#forgotPassword_email").val()},
		success: function(responseData, textStatus, jqXHR) {
			responseData = JSON.parse(responseData);			
			$("#forgotPassword_msg").html(responseData.msg);
	    	},
		error: function (responseData, textStatus, errorThrown) {$("#forgotPassword_msg").html("Connection Error, Please Try Again Later.");}
	});
}

function addProductItem(product){
	//create product element
	$("#productListContainer").append('<div class="productContainer">'+
			'<div id="cartCount'+product.itemID+'" class="cartCount"><label id="cartCountLabel'+product.itemID+'">1</label></div>'+
           	'<img id="img'+product.itemID+'" src="'+product.image+'"/>'+
               '<img id="imgloader'+product.itemID+'" class="loader" src="images/Loading-Icon-250.gif" />'+
               '<div class="textPadding">'+
               	'<h2>'+product.title+'</h2>'+
               	'<label class="stock">Stock: '+product.stock+'</label><br/>'+
               	'<label class="price">Price: R'+product.price+'</label><br/>'+
              	'<label class="price-description">'+product.priceDes+'</label>'+
				'<img src="images/Add Button.jpg" class="add_btn" onclick="getProductItem('+product.itemID+')"  />'+
             '</div>'+
         '</div>');
	$('#cartCount'+product.itemID).hide();
	//check if product is already in the cart
	$.each(cart, function(index, value){
		//if in cart update cartCountLabel
		if(value.ID==product.itemID){
			$('#cartCountLabel'+product.itemID).html(value.amount);
			$('#cartCount'+product.itemID).show();
		}
	});
	$('#img'+product.itemID).on('load', function(){$('#imgloader'+product.itemID).hide();});
}

function gotoProfileSettings(){
	$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"getProfile",
			"token": token},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				$("#settings_name").val(responseData.name);
				$("#settings_contactNumber").val(responseData.contactNumber);
				$("#settings_email").val(responseData.email);
				$("#settings_msg").val(' ');
	    	},
		error: function (responseData, textStatus, errorThrown) {$("#settings_msg").html("Connection Error, Please Try Again Later.");}
	});	
	window.location = '#profileSettings';	
}

function updateProfile(){
	if($("#settings_name").val().length < 5){
		$("#settings_msg").html("Name to short.");
		return false;
	}
	if($("#settings_contactNumber").val().length < 10){
		$("#settings_msg").html("Please input a valid contact number.");
		return false;
	}
	if(!isEmail($("#settings_email").val())){
		$("#settings_msg").html("Please input a valid email address.");
		return false;
	}
	$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"updateProfile",
			"name": $("#settings_name").val(),
			"email": $("#settings_email").val(),
			"contactNumber": $("#settings_contactNumber").val(),
			"token": token},
		success: function(responseData, textStatus, jqXHR){
				$("#settings_msg").html("Profile Succefully Updated.");
	    	},
		error: function (responseData, textStatus, errorThrown) {$("#settings_msg").html("Connection Error, Please Try Again Later.");}
	});	
}

function changePassword(){
	if($("#changePassword_new_password").val().length<8){
		$("#changePassword_msg").html("Your password must be 8 characters or longer.");
		return false;
	}
	
	if($("#changePassword_new_password").val() != $("#changePassword_confirm_new_password").val()){
		$("#changePassword_msg").html("Confirmation password does not match new password.");
		return false;
	}
	
	$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"changePassword",
			"oldPassword": $("#changePassword_old_password").val(),
			"newPassword": $("#changePassword_new_password").val(),
			"token": token},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				$("#changePassword_msg").html(responseData.msg);
	    	},
		error: function (responseData, textStatus, errorThrown) {$("#changePassword_msg").html("Connection Error, Please Try Again Later.");}
	});
}

function loadProducts(filter){
	$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"products",
			"filter": filter},
		success: function(responseData, textStatus, jqXHR) {
			responseData = JSON.parse(responseData);
			$.each(responseData, function(key, data){
				addProductItem(data);
			});
	    	},
		error: function (responseData, textStatus, errorThrown) {$("#register_msg").html("Connection Error, Please Try Again Later.");}
	});
}

function clearProducts(){
	$("#productListContainer").html('');	
}

function products(filter){
	var title = '';
	//Set page title based on filter
	if(filter=='veggies'){title = 'Fresh Vegetables';}
	if(filter=='artisanal'){title = 'Artisanal Goods';}
	//load content
	clearProducts();
	loadProducts(filter);
	//update product page title
	$('#products_title').html(title);
	//switch to product page
	window.location = '#products';
	
}

function getProductItem(itemID){
	$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"product",
			"productID": itemID},
		success: function(responseData, textStatus, jqXHR) {
			responseData = JSON.parse(responseData);
			$.each(responseData, function(key, data){
				$("#addToCartImg").attr('src',responseData.image);
				$("#addToCartTitle").html(responseData.title);
				$("#addToCartStock").html('Stock: '+responseData.stock);
				$("#addToCartPrice").html('Price: R'+responseData.price+' '+responseData.priceDes);
				$("#addToCartBtn").attr('onclick','addToCart('+responseData.itemID+','+responseData.price+','+responseData.stock+')');
				addToCartMax = responseData.stock;
				$("#addToCartAddNumber").html(parseInt($("#cartCountLabel"+responseData.itemID).html()));
			});
	    	},
		error: function (responseData, textStatus, errorThrown) {}
	});
	
	$("#addToCartContainer").show();	
}

function addToCartIncrement(){
	$('#addToCartAddNumber').html(parseInt($('#addToCartAddNumber').html())+1);
	if(parseInt($('#addToCartAddNumber').html())>20){
		$('#addToCartAddNumber').html(20);
	}
	if(parseInt($('#addToCartAddNumber').html())>addToCartMax){
		$('#addToCartAddNumber').html(addToCartMax);
	}
}

function addToCartDecrement(){
	$('#addToCartAddNumber').html(parseInt($('#addToCartAddNumber').html())-1);
	if(parseInt($('#addToCartAddNumber').html())<1){
		$('#addToCartAddNumber').html(0);
	}
}

function addToCart(productID, Price, Stock){
	//check if product has already been added to the cart
	var alreadyInCart = false;
	var productIndex = 0;
	$.each(cart,function(index, value){
		if(value.ID==productID){alreadyInCart=true; productIndex=index;}
	});
	//add or edit product in cart
	if(alreadyInCart){
		cart[productIndex].amount = parseInt($("#addToCartAddNumber").html());
	}else{
		cart.push({ID:productID,title:$("#addToCartTitle").html(),price:Price, stock:Stock, amount:parseInt($("#addToCartAddNumber").html())});
	}
	
	$("#addToCartContainer").hide();
	$('#cartCount'+productID).show();
	$('#cartCountLabel'+productID).html(parseInt($("#addToCartAddNumber").html()));
}

function cleanCart(){
	newCart = [];
	for(i=0;i<cart.length;i++){
		if(cart[i].amount>0){newCart.push(cart[i]);}
	}
	cart = newCart;
}

function populateCart(){
	var total = 0;
	cleanCart();
	console.log('Cart Size: '+cart.length);
	if(cart.length==0){
		$("#myBagProceedBtn").html("Back"); $("#myBagProceedBtn").attr("onclick","window.location = '#homeScreen'");
	}else{
		$("#myBagProceedBtn").html("Proceed"); $("#myBagProceedBtn").attr("onclick","proceed();");
	}
	$("#cartTable").html('<tr id="titleRow"><td class="col1">Item</td><td class="col2"></td><td class="col3">Amount</td><td class="col4">Price</td></tr>');
	for(i=0;i<cart.length;i++){
		total = total+(cart[i].price*cart[i].amount);
		$("#cartTable").append('<tr><td class="col1">'+cart[i].title+'</td><td class="col2"><i class="fa fa-2x fa-plus-circle" onclick="increaseCartItem('+i+');"></i><i class="fa fa-2x fa-minus-circle" onclick="decreaseCartItem('+i+');"></i></td><td id="amount-'+i+'" align="center">'+cart[i].amount+'</td><td id="price-'+i+'" align="left">R'+(cart[i].price*cart[i].amount)+'</td></tr>'	);
	}
	$("#cartTable").append('<tr id="titleTotalRow"><td></td><td></td><td></td><td>Total</td></tr>');
	$("#cartTable").append('<tr><td></td><td><td></td></td><td id="myBagTotal" align="left">R'+total+'</td></tr>');
	cartTotal = total;
	window.location = "#myBag";
}

function increaseCartItem(i){
	cartTotal = (cartTotal-(parseInt($("#amount-"+i).html())*cart[i].price));
	$("#amount-"+i).html(parseInt($("#amount-"+i).html())+1);
	if(parseInt($("#amount-"+i).html())>20){$("#amount-"+i).html(20);}
	if(parseInt($("#amount-"+i).html())>cart[i].stock){$("#amount-"+i).html(cart[i].stock);}
	cart[i].amount = parseInt($("#amount-"+i).html());
	$("#price-"+i).html('R'+(cart[i].price*cart[i].amount));
	cartTotal = (cartTotal+(parseInt($("#amount-"+i).html())*cart[i].price));
	$("#myBagTotal").html('R'+cartTotal);
}

function decreaseCartItem(i){
	cartTotal = (cartTotal-(parseInt($("#amount-"+i).html())*cart[i].price));
	$("#amount-"+i).html(parseInt($("#amount-"+i).html())-1);
	if(parseInt($("#amount-"+i).html())<0){$("#amount-"+i).html(0);}
	cart[i].amount = parseInt($("#amount-"+i).html());
	$("#price-"+i).html('R'+(cart[i].price*cart[i].amount));
	cartTotal = (cartTotal+(parseInt($("#amount-"+i).html())*cart[i].price));
	$("#myBagTotal").html('R'+cartTotal);
}

function editCart(){
	$('.col1').each(function(index, element) {
        $(element).addClass('edit');
    });
	$('.col2').each(function(index, element) {
        $(element).addClass('edit');
    });
	$("#myBagEditBtn").html("Done");
	$("#myBagEditBtn").attr("onclick","updateCart()");
}

function updateCart(){
	$('.col1').each(function(index, element) {
        $(element).removeClass('edit');
    });
	$('.col2').each(function(index, element) {
        $(element).removeClass('edit');
    });
	$("#myBagEditBtn").html("Edit");
	$("#myBagEditBtn").attr("onclick","editCart()");
	$("#myBagProceedBtn").html("Proceed");
	populateCart();
}

function clearCart(){
	cart=[];
	populateCart();
}

function showFrame(){
	$('#newsLetterContainer').html('<iframe height="100%" id="newsLetterFrame" frameborder="0" width="100%" src="https://m.takealot.com"></iframe>');
}

function createOrder(){
		$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"createOrder",
				"token": token,
				"products":cart},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				orderID = responseData.orderID;
				localStorage.orderID = orderID;
	    	},
		error: function (responseData, textStatus, errorThrown) {alert("A Major Error has occured, please try again later");}
	});	
}

function addDropOffLocation(){
		$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"addDropOffLocation",
				"token": token,
				"location":$('#dropOffLocation').val(),
				"orderID": orderID},
		success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					if(responseData.requiresDeposit==0){requiresDeposit=false;}else{requiresDeposit=true;}
					deposit = responseData.deposit;
					confirmOrder(responseData.location);
	    	},
		error: function (responseData, textStatus, errorThrown) {alert("A Major Error has occured, please try again later");}
	});	
}

function cancelOrder(){
		window.location = "#myBag";	
		$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"cancelOrder",
				"token": token,
				"orderID":orderID},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				orderID = 0
				localStorage.orderID=0;
				localStorage.removeItem('orderID');
	    	},
		error: function (responseData, textStatus, errorThrown) {alert("A Major Error has occured, please try again later");}
	});	
}

function proceed(){
	createOrder();
	updateDropOffLocationMap();
	window.location = "#selectDropOffLocation";	
}

function confirmOrder(location){
	var total = 0;
	$("#confirmOrderCartTable").html('<tr id="confirmOrderTitleRow"><td class="confirmOrderCol1">Item</td><td class="confirmOrderCol3">Amount</td><td class="confirmOrderCol4">Price</td></tr>');
	for(i=0;i<cart.length;i++){
		total = total+(cart[i].price*cart[i].amount);
		$("#confirmOrderCartTable").append('<tr><td class="confirmOrderCol1">'+cart[i].title+'</td><td id="amount-'+i+'" align="center">'+cart[i].amount+'</td><td id="price-'+i+'" align="left">R'+(cart[i].price*cart[i].amount)+'</td></tr>'	);
	}
	if(requiresDeposit){
		$("#confirmOrderCartTable").append('<tr><td colspan="2">Bag Deposit</td><td style="border-top:black 1px solid; border-bottom:1px black solid;" align="left">R'+deposit+'</td></tr>');
		total = total+deposit;
	}
	$("#confirmOrderCartTable").append('<tr id="confirmOrderTitleTotalRow"><td></td><td></td><td>Total</td></tr>');
	$("#confirmOrderCartTable").append('<tr><td><td></td></td><td id="confirmOrderTotal" align="left">R'+total+'</td></tr>');
	cartTotal = total;
	
	$('#confirmOrderDropOffPoint').html('<label class="title">Drop Off Point: </label><label>'+location+'</label>');
	
	window.location = "#confirmOrder";
}

function checkout(){
		$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"getCards",
				"token": token
		},
		success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					$('#cards').html('');
					$.each(responseData, function(index, value){
							console.log(value[0]);
							var imagePath;
							if(value[0].cardType=='Visa'){imagePath = 'visalg.png';}else if(value[0].cardType=='MasterCard'){imagePath='MCard.jpg';}else{imagePath = 'american-express-logo4.jpg';}
							$('#cards').append('<label><input type="radio" value="'+value[0].cardVaultID+'" name="card"><div class="card"><img src="images/'+imagePath+'" /><b>'+value[0].cardNumber+'</b></div></label>');
						});
					$('#cards').append('<label><input type="radio" value="NEW" name="card"><div class="card">Add New Card.</div></label>');
					
	    		},
		error: function (responseData, textStatus, errorThrown) {alert("A Major Error has occured, please try again later");}
	});		
	window.location = '#selectCard';
}

function payOrder(cardVaultID){
	var returnURL = 'https://inglenookapp.co.za/return.php';
	$('#payment_iframe').attr('style','');
	window.location = '#paymentPage';
	$('#menu_btn').hide();
	disableMenu = true;
	
	if(cardVaultID=='NEW'){cardVaultID='';}
	localStorage.cardValtID = cardVaultID;
	$.ajax({
		url:HOST,
		type:"POST",
		crossDomain: true,
		data: {	"f":"payForOrder",
				"token": token,
				"orderID":orderID,
				"cardVaultID":cardVaultID,
				"returnURL": returnURL},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				if(responseData.msg!='Failed'){
					$("#payment_iframe").attr('src','https://inglenookapp.co.za/redirect.php?payRequestID='+responseData.PAY_REQUEST_ID+'&checksum='+responseData.CHECKSUM);
					//fade in
					setTimeout(function(){$('#payment_iframe').attr('style','opacity:1');},5000);
				}else{
					alert("A major error has occured, please try again later.");
				}
	    	},
		error: function (responseData, textStatus, errorThrown) {alert("A Major Error has occured, please try again later");}
	});		
}

function checkOrderStatus(){
	if(orderID==0){return 0}
	var output = 0;
	$.ajax({
		url:HOST,
		async: false,
		type:"POST",
		crossDomain: true,
		data: {	"f":"checkOrderStatus",
				"token": token,
				"orderID":orderID},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				output = responseData.status;
				console.log(responseData);
	    	},
		error: function (responseData, textStatus, errorThrown) {alert("A Major Error has occured, please try again later");}
	});	
	
	return output;
}

function updateStock(){
	$.ajax({
			url:HOST,
			async: false,
			type:"POST",
			crossDomain: true,
			data: {	"f":"updateStock",
					"token": token,
					"orderID":orderID},
			success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
				},
			error: function (responseData, textStatus, errorThrown) {alert("A Major Error has occured, please try again later");}
		});
}

function paymentComplete(){
	var status = checkOrderStatus();
	window.location = '#paymentComplete';
	if(status=='0'){
		$.ajax({
			url:HOST,
			async: false,
			type:"POST",
			crossDomain: true,
			data: {	"f":"checkPaymentStatus",
					"token": token,
					"orderID":orderID},
			success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					status = responseData.status;
				},
			error: function (responseData, textStatus, errorThrown) {alert("A Major Error has occured, please try again later");}
		});	
	}
	
	if(status=='1'){
		$('#paymentCompleteTitle').html('Payment Complete');
		$('#paymentCompleteContent').html('Your order has been successfully completed. You can check on order at any time using <b>Track Order</b> option in the menu bar.');	
		$('#paymentCompleteBtns').html('<button onClick="window.location = '+"'#homeScreen'"+'">Done</button>');
		updateStock();
		clearCart();
		orderID = 0;

	}
	
	if(status=='2'){
		$('#paymentCompleteTitle').html('Payment Failed');
		$('#paymentCompleteContent').html('The transaction was declined.');
		$('#paymentCompleteBtns').html('<button onClick="cancelOrder()">Cancel Order</button>');
		$('#paymentCompleteBtns').html('<button onClick="payOrder(localStorage.cardValtID)">Try Again</button>'+$('#paymentCompleteBtns').html());	
	}
	
	if(status=='3' || status=='4'){
		$('#paymentCompleteTitle').html('Payment Cancelled');
		$('#paymentCompleteContent').html('The transaction was cancelled.');
		$('#paymentCompleteBtns').html('<button onClick="cancelOrder()">Cancel Order</button>');
		$('#paymentCompleteBtns').html('<button onClick="payOrder(localStorage.cardValtID)">Try Again</button>'+$('#paymentCompleteBtns').html());
			
	}
	
	if(status=='5'){
		$('#paymentCompleteTitle').html('Payment Failed');
		$('#paymentCompleteContent').html('A seriouse error has occured, please contact us so we can help you.');
	}
}

function addTrackingInfo(orderID){
	//get order info
	var status = 0;
	var dropoff = '';
	$.ajax({
			url:HOST,
			async: false,
			type:"POST",
			crossDomain: true,
			data: {	"f":"getOrderInfo",
					"token": token,
					"orderID":orderID},
			success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					orderID = responseData.orderID;
					status = responseData.status;
					dropoff = responseData.dropoff;
					
				},
			error: function (responseData, textStatus, errorThrown) {alert("A Major Error has occured, please try again later");}
		});	
		
	//Expand dropoff details
	
	if(dropoff == 'Cape Town'){dropoff = 'Cape Town <a href="https://goo.gl/maps/ApwHWZmF5GG2">View Map</a>';}
	if(dropoff == 'Hout Bay'){dropoff = 'Hout Bay <a href="https://goo.gl/maps/Na81xjo1MSx">View Map</a>';}
	
	
	//create tracking info 
	$('#trackingContainer').append('<div>'+
		'<div>'+	
        	'<label class="purple">Order Number:</label>'+
        	'<label class="trackOrderOrderID">'+orderID+'</label>'+
        	'<label class="purple">Drop Off Point:</label>'+
            '<label class="trackOrderDropOffPoint">'+dropoff+'</label>'+
        '</div>'+
        '<div style="background:#f9f0f3"><img src="images/Tracking_0'+status+'.jpg" class="trackOrderImg" /></div>'+
		'</div>'
		);
	
}

function updateTracking(){
	var orderList = null;
	//clear tracking page
	$('#trackingContainer').html('');
	//get list of all active orders
	$.ajax({
			url:HOST,
			async: false,
			type:"POST",
			crossDomain: true,
			data: {	"f":"getTrackingOrders",
					"token": token},
			success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					orderList = responseData.orderList;
					
				},
			error: function (responseData, textStatus, errorThrown) {alert("A Major Error has occured, please try again later");}
		});	
	//add order list to tracking page
	$.each(orderList,function(index, value){addTrackingInfo(value);});
	//go to order tracking page
	window.location = '#trackOrder';
}

function updateDropOffLocationMap(){
	if($('#dropOffLocation').val()=='Darling')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3331.810979698483!2d18.379740314712365!3d-33.376000501080235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dccb8d674307ebb%3A0x5a2fe4f21e3ed30a!2sThe+Flying+Pig!5e0!3m2!1sen!2sza!4v1502343476418');
		}
		
	if($('#dropOffLocation').val()=='Grotto Bay')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6653.979277415486!2d18.315763590942158!3d-33.50164669914919!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc9673aad89e09%3A0x2bee873696a85ed!2sGrotto+Bay!5e0!3m2!1sen!2sza!4v1502343587402');
		}
	
	if($('#dropOffLocation').val()=='Tableview')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3310.8211365788175!2d18.419045914731928!3d-33.92000272914862!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc6766b7663daf%3A0xa6f560ca852d2fa2!2sStrand+Tower+Hotel!5e0!3m2!1sen!2sza!4v1502342319783');
		}
	
	if($('#dropOffLocation').val()=='Cape Town')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3310.8211365788175!2d18.419045914731928!3d-33.92000272914862!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc6766b7663daf%3A0xa6f560ca852d2fa2!2sStrand+Tower+Hotel!5e0!3m2!1sen!2sza!4v1502342319783');
		}
	
	if($('#dropOffLocation').val()=='Hout Bay')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.9691387872604!2d18.360727014736376!3d-34.04466273563808!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc6910c87974db%3A0x125d83276db6f072!2s13+Baviaanskloof+Rd%2C+Scott+Estate%2C+Cape+Town%2C+7806!5e0!3m2!1sen!2sza!4v1502343762609');
		}
}

//Connect to return.php from iFrame
window.addEventListener("message", function(event) {
	paymentComplete();
	$('#menu_btn').show();
	disableMenu = false;
});