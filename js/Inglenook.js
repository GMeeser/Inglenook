//Variables
var token = localStorage.token;
var HOST = "https://inglenookapp.co.za/v2/api.php";
//var HOST = "http://home.meeser.co.za:900/grant/Apps/Server%20Backends/Inglenook/api.php";
//var HOST = "http://server1/grant/Apps/Server%20Backends/Inglenook/api.php";

var addToCartMax = 0;
var cart = [];
var cartTotal = 0;

var orderID = localStorage.orderID;
var requiresDeliveryFee = true;
var deliveryFee = 0;

var disableMenu = false;

$.ajaxSetup({cache:false});

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
	
	//hide cart floating button
	$('#cartButton').hide();
	
	//hide profile settings from menu
	$('#menuSettings').hide();
	$('#menuTrackOrder').hide();
	$('#menuLogoutBtn').html('<li style="border-bottom-width:2px;"><i class="fa fa-sign-in fa-fw"></i> Log In</li>');
	$('#menuLogoutBtn').attr('onClick','');
	$('#menuLogoutBtn').attr('href','#logIn');

	$('#menu_btn').show();
	
	console.log();
	window.location = "#homeScreen"; 
	orderID=0;
	
	updateDropOffLocations();
	updateAddressSuburb();
	
	$.mobile.loadingMessage = false;
	$("#login_password").keydown(function (e){if (e.keyCode == 13){$("#login_btn").click();}});
	$("#register_confirm_password").keydown(function (e){if (e.keyCode == 13){$("#register_btn").click();}});
}

function updateDropOffLocations(){
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"getDropOffLocations"},
		success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					//Add drop off locations from server
					$('#dropOffLocation').html('<optgroup label="Drop Off Locations">');
					$.each(responseData.locations,function(index,value){
						$('#dropOffLocation').append('<option value="'+value+'">'+value+'</option>');
					});
					$('#dropOffLocation').append('</optgroup>');
					$('#dropOffLocation').append('<optgroup label="Other">');
					$('#dropOffLocation').append('<option value="Delivery">Add Delivery Address');
					$('#dropOffLocation').append('</optgroup>');
	    	},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});	
}

function updateAddressSuburb(){
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"getSuburbs"},
		success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					//Add drop off locations from server
					$('#addressSuburb').html('');
					$.each(responseData.suburbs,function(index,value){
						$('#addressSuburb').append('<option value="'+value+'">'+value+'</option>');
					});
	    	},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});	
}

function connectionError(){
	window.location = '#connectionError';	
}

function validateToken(){
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {"f":"validateToken","token": token},
		success: function(responseData, textStatus, jqXHR) {
				console.log("Token Valid");
				$('#menuSettings').show();
				$('#menuTrackOrder').show();
				$('#menuLogoutBtn').html('<li style="border-bottom-width:2px;"><i class="fa fa-sign-out fa-fw"></i> Log Out</li>');
				$('#menuLogoutBtn').attr('onClick','logout()');
				$('#menuLogoutBtn').attr('href','#');
			},
		error: function (responseData, textStatus, errorThrown) {
				console.log("Token Invalid");
				//$('#menu_btn').hide();
				token=0;
				window.location = "#logIn";
			}
	});
}

function isLogedIn(){
	console.log("Login Check");
	if(token==0){
		//$('#menu_btn').hide();
		window.location = "#logIn";
		$.mobile.navigate.history.stack.slice(-2,2);
		console.log("Not Logged In");
		return false;
	}
	validateToken();
}

function openMenu(){
	if(disableMenu==false){
		$("#menu").addClass('open');
	}
}

function closeMenu(){
	$("#menu").removeClass('open');
}

function login(){
	$("#login_msg").html("Processing...");
	
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {"f":"login","email": $("#login_email").val(),"password": $("#login_password").val()},
		success: function(responseData, textStatus, jqXHR) {
			responseData = JSON.parse(responseData);
			token = responseData.token;
			if(token!=0){
				localStorage.token = token;
				populateCart();
				
				$("#login_email").val('');
				$("#login_password").val('');
				$("#login_msg").html(" ");
				
				$('#menuSettings').show();
				$('#menuTrackOrder').show();
				$('#menuLogoutBtn').html('<li style="border-bottom-width:2px;"><i class="fa fa-sign-out fa-fw"></i> Log Out</li>');
				$('#menuLogoutBtn').attr('onClick','logout()');
				$('#menuLogoutBtn').attr('href','#');
				
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
	//$('#menu_btn').hide();
	window.location = '#logIn';
	$('#cartButton').hide(250);
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
		cache:false,
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
				
				$('#menuSettings').show();
				$('#menuTrackOrder').show();
				$('#menuLogoutBtn').html('<li style="border-bottom-width:2px;"><i class="fa fa-sign-out fa-fw"></i> Log Out</li>');
				$('#menuLogoutBtn').attr('onClick','logout()');
				$('#menuLogoutBtn').attr('href','#');
				
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
		cache:false,
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
	$('#menu_btn').show(250);
	disableMenu=false;
	$("#settings_msg").html("Loading");
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"getProfile",
			"token": token},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				$("#settings_name").val(responseData.name);
				$("#settings_contactNumber").val(responseData.contactNumber);
				$("#settings_email").val(responseData.email);
				$("#settings_msg").html(' ');
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
		cache:false,
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
		cache:false,
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
		cache:false,
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
	if(filter=='veggies'){title = 'Organic Vegetables';}
	if(filter=='artisanal'){title = 'Artisanal Goods';}
	//load content
	clearProducts();
	loadProducts(filter);
	//update product page title
	$('#products_title').html(title);
	//switch to product page
	window.location = '#products';
	//show floating cart button
	if(cart.length>0){
		$('#cartButton').show(250);
	}
	
}

function getProductItem(itemID){
	//Show loading data
	$("#addToCartImg").attr('src','images/Loading-Icon-250.gif');
	$("#addToCartTitle").html('Loading...');
	$("#addToCartStock").html('');
	$("#addToCartPrice").html('');
	$("#addToCartBtn").attr('onclick','');
	addToCartMax = 0;
	$("#addToCartAddNumber").html(0);
	
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
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
	
	//show addItem, hide buttons
	$("#addToCartContainer").show(250);
	$('#cartButton').hide(250);
	$("#menu_btn").hide(250);	
}

function addToCartIncrement(){
	$('#addToCartAddNumber').html(parseInt($('#addToCartAddNumber').html())+1);
	if(parseInt($('#addToCartAddNumber').html())>10){
		$('#addToCartAddNumber').html(10);
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
	
	$('#cartButton label').html(cart.length);
	$('#cartButton').show(250);
	$('#menu_btn').show(250);
	
	$("#addToCartContainer").hide(250);
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
	$('#menu_btn').show(250);
	disableMenu=false;
	
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
	$('#cartButton').hide(250);
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

function createOrder(){
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"createOrder",
				"token": token,
				"products":cart},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				orderID = responseData.orderID;
				localStorage.orderID = orderID;
			},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});	
}

function addDropOffLocation(location){
	//compile address
	if(location==''){
		location = $('#addressLine1').val()+', '+$('#addressLine2').val()+', '+$('#addressSuburb').val()+', '+$('#addressCity').val()+', '+$('#addressProvince').val()+', '+$('#addressCountry').val()+', '+$('#addressPostalCode').val();
	
		//check if new address
		if($('#addressSelect').val()=='NEW'){
			addAddress();
		}
	}
	
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"addDropOffLocation",
				"token": token,
				"location":location,
				"orderID": orderID},
		success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					if(responseData.requiresDeliveryFee==0){requiresDeliveryFee=false;}else{requiresDeliveryFee=true;}
					deliveryFee = responseData.deliveryFee;
					confirmOrder(responseData.location);
	    	},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});	
}

function cancelOrder(){
		window.location = "#myBag";	
		$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
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
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});	
}

function proceed(){
	if(isLogedIn()==false){return 0;}
	createOrder();
	updateDropOffLocationMap();
	window.location = "#selectDropOffLocation";	
}

function confirmOrder(location){
	var total = 0;
	//Products
	$("#confirmOrderCartTable").html('<tr id="confirmOrderTitleRow"><td class="confirmOrderCol1">Item</td><td class="confirmOrderCol3">Amount</td><td class="confirmOrderCol4">Price</td></tr>');
	for(i=0;i<cart.length;i++){
		total = total+(cart[i].price*cart[i].amount);
		$("#confirmOrderCartTable").append('<tr><td class="confirmOrderCol1">'+cart[i].title+'</td><td id="amount-'+i+'" align="center">'+cart[i].amount+'</td><td id="price-'+i+'" align="left">R'+(cart[i].price*cart[i].amount)+'</td></tr>'	);
	}
	
	//deposit
	$("#confirmOrderCartTable").append('<tr><td colspan="2">Bag Deposit</td><td style="border-top:black 1px solid;" align="left">R0</td></tr>');
	
	//delivery fee
	if(requiresDeliveryFee){
		$("#confirmOrderCartTable").append('<tr><td colspan="2">Delivery Fee</td><td align="left">R'+deliveryFee+'</td></tr>');
		total = total+deliveryFee;
	}
	$("#confirmOrderCartTable").append('<tr id="confirmOrderTitleTotalRow"><td></td><td></td><td>Total</td></tr>');
	$("#confirmOrderCartTable").append('<tr><td><td></td></td><td id="confirmOrderTotal" align="left">R'+total+'</td></tr>');
	cartTotal = total;
	
	$('#confirmOrderDropOffPoint').html('<label class="title">Drop Off Point: </label><label>'+location+'</label>');
	
	window.location = "#confirmOrder";
}

function checkout(){
		//payOrder('NEW');
		
		$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
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
							//select correct image
							if(value[0].cardType=='Visa'){
								imagePath = 'visalg.png';
							}else if(value[0].cardType=='MasterCard'){
								imagePath='MCard.jpg';
							}else{
								imagePath = 'american-express-logo4.jpg';
							}
							
							$('#cards').append('<label><input type="radio" value="'+value[0].cardVaultID+'" name="card"><div class="card"><img src="images/'+imagePath+'" /><b>'+value[0].cardNumber+'</b></div></label>');
							
						});
					$('#cards').append('<label><input type="radio" value="NEW" name="card"><div class="card">Add New Card.</div></label>');
					
	    		},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});		
	window.location = '#selectCard';

}

function goToGateway(cardVault){
	
	$('#paymentVaultID').val(cardVault);
	$('#paymentCVV').val('');
	
	var year = (new Date()).getFullYear();
	$('#paymentYear').html();
	for(i=0;i<20;i++){
		$('#paymentYear').append('<option value="'+year+'">'+year+'</option>');
		year++;
	}
	$('#paymentMsg').html(' ');
	
	$.ajax({
		url:HOST,
		async: false,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"getCard",
				"token": token,
				"vaultID":cardVault},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				$('#paymentCardNumber').val(responseData.cardNumber);
				$('#paymentMonth').val(responseData.cardExpiryDate.substring(0,2));
				$('#paymentYear').val(responseData.cardExpiryDate.substring(2));
	    	},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});	
	
	window.location = '#paymentPage';
}

function validateCardData(){
	$('#paymentContinueBtn').attr('onClick','');
	$('#paymentContinueBtn').attr('disabled','disabled');
	
	//check input  lengths
	if($('#paymentFirstName').val().length < 2){return false;}
	if($('#paymentLastName').val().length < 2){return false;}
	if($('#paymentCardNumber').val().length < 13){return false;}
	if($('#paymentCVV').val().length < 3){return false;}
	
	//validate expirydate
	if($('#paymentYear').val() == (new Date()).getFullYear()){
		if($('#paymentMonth').val() <= (new Date()).getMonth()+1){
				return false;
		}
	}
	
	/*
	//check that credit ard number only contains numbers
	if((/^\d+$/.test($('#paymentCardNumber').val()))==false){
		return false;
	}
	*/
	
	$('#paymentContinueBtn').attr('onClick','payOrder()');
	$('#paymentContinueBtn').removeAttr('disabled');
		
}

function payOrder(){
	var cardVaultID = $('#paymentVaultID').val();
	if(cardVaultID=='NEW'){cardVaultID='';}
	localStorage.cardValtID = cardVaultID;
	
	$('#paymentMsg').html('Processing Payment');
	
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"payForOrder",
				"token": token,
				"orderID":orderID,
				"cardVaultID":cardVaultID,
				"cardNumber": $('#paymentCardNumber').val(),
				"cardExpiryDate": $('#paymentMonth').val()+$('#paymentYear').val(),
				"cvv": $('#paymentCVV').val(),
				"name": $('#paymentFirstName').val()+' '+$('#paymentLastName').val()
		},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				if(responseData.msg=='Success'){
					$('#paymentCompleteTitle').html('Payment Complete');
					$('#paymentCompleteContent').html('Your order has been successfully completed. You can check on order at any time using <b>Track Order</b> option in the menu bar.');	
					$('#paymentCompleteBtns').html('<button onClick="window.location = '+"'#homeScreen'"+'">Done</button>');
					window.location = '#paymentComplete';
					//clearCart();
					orderID = 0;
				}else if(responseData.msg =='An error occured please try again.'){
					$('#paymentCompleteTitle').html('Oh No');
					$('#paymentCompleteContent').html('An error occured while processing your payment, please try again.');
					$('#paymentCompleteBtns').html('<button onClick="checkout()">Try Again</button>');	
					$('#paymentCompleteBtns').append('<button onClick="window.location = '+"'#homeScreen'"+'">Cancel</button>');
					window.location = '#paymentComplete';
				}else{
					$('#paymentCompleteTitle').html('Payment Failed');
					$('#paymentCompleteContent').html('Your payment has failed due to:</p><b>'+responseData.reason+'</b>');
					$('#paymentCompleteBtns').html('<button onClick="checkout()">Try Again</button>');	
					$('#paymentCompleteBtns').append('<button onClick="window.location = '+"'#homeScreen'"+'">Cancel</button>');
					window.location = '#paymentComplete';
				}
	    	},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});		
}

function checkOrderStatus(){
	if(orderID==0){return 0}
	var output = 0;
	$.ajax({
		url:HOST,
		async: false,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"checkOrderStatus",
				"token": token,
				"orderID":orderID},
		success: function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				output = responseData.status;
				console.log(responseData);
	    	},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});	
	
	return output;
}

function updateStock(){
	$.ajax({
			url:HOST,
			async: false,
			type:"POST",
		cache:false,
			crossDomain: true,
			data: {	"f":"updateStock",
					"token": token,
					"orderID":orderID},
			success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
				},
			error: function (responseData, textStatus, errorThrown) {connectionError();}
		});
}

function addTrackingInfo(orderID){
	//get order info
	var status = 0;
	var dropoff = '';
	$.ajax({
			url:HOST,
			async: false,
			type:"POST",
		cache:false,
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
			error: function (responseData, textStatus, errorThrown) {connectionError();}
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
	$('#menu_btn').show(250);
	disableMenu=false;
	
	var orderList = null;
	//clear tracking page
	$('#trackingContainer').html('');
	//get list of all active orders
	$.ajax({
			url:HOST,
			async: false,
			type:"POST",
		cache:false,
			crossDomain: true,
			data: {	"f":"getTrackingOrders",
					"token": token},
			success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					orderList = responseData.orderList;
					
				},
			error: function (responseData, textStatus, errorThrown) {connectionError();}
		});	
	//add order list to tracking page
	$.each(orderList,function(index, value){addTrackingInfo(value);});
	//go to order tracking page
	window.location = '#trackOrder';
	$('#cartButton').hide(250);
}

function updateDropOffLocationMap(){
	if($('#dropOffLocation').val()=='Darling')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3331.810979698483!2d18.379740314712365!3d-33.376000501080235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dccb8d674307ebb%3A0x5a2fe4f21e3ed30a!2sThe+Flying+Pig!5e0!3m2!1sen!2sza!4v1502343476418');
		}
		
	if($('#dropOffLocation').val()=='Grotto Bay')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3326.921393563506!2d18.317444514716925!3d-33.503422207617916!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc966dff60d5bf%3A0x4c989184ac0095a7!2sSea+Eagle+Dr%2C+Grotto+Bay!5e0!3m2!1sen!2sza!4v1502350074317');
		}
	
	if($('#dropOffLocation').val()=='Tableview')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3314.5530466851847!2d18.481411314728458!3d-33.82384552415738!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc5f0c4986ca2f%3A0xcf7de1573857d1e!2s52+Blaauwberg+Rd%2C+Table+View%2C+Cape+Town%2C+7441!5e0!3m2!1sen!2sza!4v1502350294167');
		}
	
	if($('#dropOffLocation').val()=='Cape Town')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3310.8211365788175!2d18.419045914731928!3d-33.92000272914862!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc6766b7663daf%3A0xa6f560ca852d2fa2!2sStrand+Tower+Hotel!5e0!3m2!1sen!2sza!4v1502342319783');
		}
	
	if($('#dropOffLocation').val()=='Hout Bay')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.9691387872604!2d18.360727014736376!3d-34.04466273563808!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc6910c87974db%3A0x125d83276db6f072!2s13+Baviaanskloof+Rd%2C+Scott+Estate%2C+Cape+Town%2C+7806!5e0!3m2!1sen!2sza!4v1502343762609');
		}
	if($('#dropOffLocation').val()=='AAA Travel')
		{
			$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3306.0141948179653!2d18.348203315214818!3d-34.04350698060827!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc69249e093b05%3A0xbcf362f05c10a7c1!2sAAA+TRAVEL+AFRICA!5e0!3m2!1sen!2sza!4v1502910252612');
		}
	if($('#dropOffLocation').val()=='Sea Point')
		{	
		$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3310.8204332304213!2d18.382563614731918!3d-33.92002082914944!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc67219526464b%3A0xeecc1a34e0ebfbe2!2sSea+Point+Nursery!5e0!3m2!1sen!2sza!4v1502979445681');
		}
	if($('#dropOffLocation').val()=='Camps Bay - Sunset Sessions')
		{	
		$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3309.562644398707!2d18.3775548586834!3d-33.95237523619917!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc6652e4343943%3A0xc1e09fbac40fda3d!2s69+Victoria+Rd%2C+Camps+Bay%2C+Cape+Town%2C+8040!5e0!3m2!1sen!2sza!4v1504160728823');
		}
		if($('#dropOffLocation').val()=='Yzerfontein')
		{	
		$('#selectDropOffLocationMap').attr('src','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3333.0077742262747!2d18.159095114711196!3d-33.3447466994801!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcca5ebf8460529%3A0x65b662681862e5a0!2s5+Main+Rd%2C+Yzerfontein%2C+7351!5e0!3m2!1sen!2sza!4v1504505937518');
		}
		
}

function newsletter(){
	$('#newsLetterContainer').html('<h1>Loading...</h1>');
	//get list of all active orders
	window.location = '#newsLetter';
	$.ajax({
			url:'https://inglenookapp.co.za/newsletter.php',
			type:"POST",
		cache:false,
			crossDomain: true,
			success: function(responseData, textStatus, jqXHR){
					$('#newsLetterContainer').html(responseData);
				},
			error: function (responseData, textStatus, errorThrown) {connectionError();}
		});	
		
}

function ourStory(){
	$('#storyContainer').html('<h1>Loading...</h1>');
	//get list of all active orders
	window.location = '#story';
	$.ajax({
			url:'https://inglenookapp.co.za/story.php',
			type:"POST",
		cache:false,
			crossDomain: true,
			success: function(responseData, textStatus, jqXHR){
					$('#storyContainer').html(responseData);
				},
			error: function (responseData, textStatus, errorThrown) {connectionError();}
		});	
		
}

function checkForDelivery(){
	if($('#dropOffLocation').val()=='Delivery'){
		$('#selectDropOffLoactionBtn').attr('onClick',"goToSelectAddress()");
		$('#selectDropOffLoactionBtn').html('Add Delivery Address');
	}else{
		$('#selectDropOffLoactionBtn').attr('onClick',"addDropOffLocation($('#dropOffLocation').val())");
		$('#selectDropOffLoactionBtn').html('Confirm Order');
	}
}

function goToSelectAddress(){
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"getAddressList",
				"token":token},
		success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					//get addresses from server
					$('#addressSelect').html('<option value="NEW" selected >Add New Address</option>');
					$.each(responseData.addresses,function(index,value){
						$('#addressSelect').append('<option value="'+value.addressID+'">'+value.addressLine1+'</option>');
					});
					window.location = "#selectAddress";
	    	},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});		
}

function goToAddress(){
	if($('#addressSelect').val()=='NEW'){
		$('#addressLine1').val('');
		$('#addressLine2').val('');
		$('#addressCity').val('Cape Town');
		$('#addressProvince').val('Western Cape');
		$('#addressCountry').val('South Africa');
		$('#addressPostalCode').val('');
		window.location = "#address";
		return false
	}else{
		var addressID = $('#addressSelect').val();
	}
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"getAddress",
				"token": token,
				"addressID":addressID},
		success: function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					//load address to form
					$('#addressLine1').val(responseData.addressLine1);
					$('#addressLine2').val(responseData.addressLine2);
					$('#addressSuburb').val(responseData.suburb);
					$('#addressCity').val(responseData.city);
					$('#addressProvince').val(responseData.province);
					$('#addressCountry').val(responseData.country);
					$('#addressPostalCode').val(responseData.postalCode);
					window.location = "#address";
	    	},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});		
}

function addAddress(){
	$.ajax({
		url:HOST,
		type:"POST",
		cache:false,
		crossDomain: true,
		data: {	"f":"addAddress",
				"token": token,
				"addressLine1":$('#addressLine1').val(),
				"addressLine2":$('#addressLine2').val(),
				"suburb":$('#addressSuburb').val(),
				"city":$('#addressCity').val(),
				"province":$('#addressProvince').val(),
				"country":$('#addressCountry').val(),
				"postalCode":$('#addressPostalCode').val(),},
		success: function(responseData, textStatus, jqXHR){},
		error: function (responseData, textStatus, errorThrown) {connectionError();}
	});		
}
