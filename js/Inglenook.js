//Variables
var token = 0;
if(typeof(localStorage.token)!='undefined'){
		token = localStorage.token;
}

var HOST = "https://inglenookapp.co.za/v2/api.php";
//var HOST = "http://home.meeser.co.za:900/grant/Apps/Server%20Backends/Inglenook/api.php";
//var HOST = "http://server1/grant/Apps/Server%20Backends/Inglenook/api.php";

var addToCartMax = 0;
var cart = [];
var cartTotal = 0;

var orderID = localStorage.orderID;
var requiresDeliveryFee = true;
var deliveryFee = 0;
var deliveryDate = '';
var seasonalBagPrice = 150;
var seasonalBagStock = 0;

var disableMenu = false;

$.ajaxSetup({cache:false});

function connectToServer(API_CALL, DATA_ARRAY, onSuccess, onError, onComplete, ASYNC){
	//check if online
	if(!isOnline()){return 0;}
	var NOW = $.now();
	//Connect to server
	$.ajax({
		url:HOST+"?"+NOW,
		type:"POST",
		cache:false,
		async: ASYNC,
		crossDomain: true,
		data: $.extend({"f":API_CALL,"token":token}, DATA_ARRAY),
		success: function(responseData, textStatus, jqXHR){
			onSuccess(responseData, textStatus, jqXHR);
			},
		error: function(responseData, textStatus, errorThrown){
				onError(responseData, textStatus, errorThrown);
			},
		complete: function(jqXHR, textStatus){
				onComplete(jqXHR, textStatus);
			},
		timeout: 60000
	});	
}

function isOnline(){
	if(!navigator.onLine){
		console.log("Device Offline");
		$('#errorTitle').html("No Internet Connection");
		$('#errorMsg').html("We have detected that you are not connected to the interent or are on an unstable connection. Please connect to WiFi or enable your mobile data to continue");
		$('#errorBtn').html('Reconnect');
		$('#errorBtn').attr('onClick','onDeviceReady()');
		window.location = '#connectionError';
		return false;
		
	}
	
	return true;
}

// Wait for PhoneGap to load
document.addEventListener("deviceready", onDeviceReady, false);
$(document).ready(onDeviceReady);

// PhoneGap is ready
function onDeviceReady() {
	window.location = '#loading';
	$('#menu_btn').hide();
	$('#cartButton').hide();
	setTimeout(function(){
		//check if online
		if(!isOnline()){return 0;}
		
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
		
		//check if token is there and valid
		if(typeof(localStorage.token)!='undefined'){
			validateToken();
		}
		
		//console.log();
		window.location = "#homeScreen";
		$('#menu_btn').show(); 
		orderID=0;
		
		updateDropOffLocations();
		updateAddressSuburb();
		
		$.mobile.loadingMessage = false;
		$("#login_password").keydown(function (e){if (e.keyCode == 13){$("#login_btn").click();}});
		$("#register_confirm_password").keydown(function (e){if (e.keyCode == 13){$("#register_btn").click();}});
		
		sendStoredErrorLog();
	},5000);
}

function updateDropOffLocations(){
	console.log("Download drop off location list");
	connectToServer('getDropOffLocations',{},function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					//update localStorage list of suburbs
					localStorage.locations = JSON.stringify(responseData.locations);
	    	},
			
			function (responseData, textStatus, errorThrown) {
					connectionError(responseData, textStatus, errorThrown, 'getDropOffLocations', {})
				},
			function(){}, false);
	
	console.log("Update drop off location list");
	//Add drop off locations from server
	$('#dropOffLocation').html('<optgroup label="Drop Off Locations">');
	$.each(JSON.parse(localStorage.locations),function(index,value){
		$('#dropOffLocation').append('<option value="'+value+'">'+value+'</option>');
	});
	$('#dropOffLocation').append('</optgroup>');
	$('#dropOffLocation').append('<optgroup label="Other">');
	$('#dropOffLocation').append('<option value="Delivery">Add Delivery Address');
	$('#dropOffLocation').append('</optgroup>');
}

function updateAddressSuburb(){
	console.log("Downloading suburb list");
	connectToServer('getSuburbs',{},function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					//update localStorage list of suburbs
					localStorage.suburbs = JSON.stringify(responseData.suburbs);
	    	},
			function (responseData, textStatus, errorThrown) {
					connectionError(responseData, textStatus, errorThrown, 'getsuburbs', {})
				},
			function(){}, false);
	
	console.log("Update suburb list");
	//Add drop off locations from server
	$('#addressSuburb').html('');
	$.each(JSON.parse(localStorage.suburbs),function(index,value){
			$('#addressSuburb').append('<option value="'+value+'">'+value+'</option>');
	});
			
}

function connectionError(responseData, textStatus, errorThrown, API_CALL, DATA_ARRAY){
	console.log("Error: "+API_CALL+' - '+errorThrown);
	if(textStatus == 'error'){
		if(errorThrown =='Bad Request'){
			if(API_CALL!='validateToken'){
				//display error
				$('#errorTitle').html("Oh No...");
				$('#errorMsg').html("We are unable to connect to the server right now due to "+errorThrown);
				window.location = '#connectionError';
				console.log("Error: "+errorThrown);
			}else{
				//leave function if error was invalid token
				return 0;
			}
		}
		
		//display error
		$('#errorTitle').html("Oh No...");
		if(errorThrown!=''){
			$('#errorMsg').html("We are unable to connect to the server right now due to "+errorThrown);
		}else{
			$('#errorMsg').html("We are unable to connect to the server right now, please try again later");
		}
		window.location = '#connectionError';
		console.log("Error: "+errorThrown);
		
	}else if(textStatus == 'timeout'){
		//display error
		$('#errorTitle').html("Oh No...");
		$('#errorMsg').html("Our connection to the server has timed out, this could be because you have a slow or unstable internet connection, or the server is very busy.");
		window.location = '#connectionError';
		console.log("Timeout Error");
	}else{
		//display error
		$('#errorTitle').html("Oh No...");
		$('#errorMsg').html("An unknown error has occurred. These can sometimes happen and we are working hard to fix them when they happen.<p/> Please let us know if the problem persists.");
		window.location = '#connectionError';
		console.log("General Error");
	}
	
		
	console.log("sending error report");
	//report error back to server asynchronouly
		$.ajax({
			url:HOST,
			type:"POST",
			cache:false,
			crossDomain: true,
			data: {	"f":"errorReport","responseData":JSON.stringify(responseData),"testStatus":textStatus,"errorThrown":errorThrown,"API_CALL":API_CALL, "DATA_ARRAY":DATA_ARRAY},
			success: function(){console.log("error report sent");},
			error: function(){
					console.log("error report not sent");
					//create error report
					var timestamp = new Date($.now()+7200000);
					errorReport = {"responseData":responseData,"textStatus":textStatus,"errorThrown":errorThrown,"API_CALL":API_CALL, "DATA_ARRAY":DATA_ARRAY,"timestamp": timestamp};
					
					//add error report to errorlog
					//load errorLog if present otherwise create one
					var errorLog = [];
					if(typeof(localStorage.errorLog)!='undefined'){ 
						errorLog = JSON.parse(localStorage.errorLog);
					}
					
					errorLog.push(errorReport);
					localStorage.errorLog = JSON.stringify(errorLog);
					console.log("error reporrt stored");
				}
		});
}

function removeFromErrorLog(errorReport){
	console.log("Remove error from errorLog");
	if(typeof(localStorage.errorLog)=='undefined'){console.log("No Stored Errors"); return 0;}
	//load errorLog from localStorage
	errorLog = JSON.parse(localStorage.errorLog);	
	//check length of array
	if(errorLog.length==0){console.log("No Stored Errors"); return 0;}
	//get the index of the report to remove
	var indexOfErrorReport = errorLog.indexOf(errorReport);
	//remove report
	errorLog.splice(indexOfErrorReport,1);
	//save errorLog to localStorage
	localStorage.errorLog = JSON.stringify(errorLog);
	
}

function sendStoredErrorLog(){
	console.log("Sending Stored Errors");
	//check if there are stored errors
	if(typeof(localStorage.errorLog)=='undefined'){console.log("No Stored Errors to Send"); return 0;}
	//load errorLog from localStorage
	errorLog = JSON.parse(localStorage.errorLog);	
	//check length of array
	if(errorLog.length==0){console.log("No Stored Errors to Send"); return 0;}
	
	//loop through error reports and send them
	for(var i=0; i<errorLog.length;i++){
		connectToServer('errorReport',errorLog[i],function(){
				//remove succesfully sent errors
				removeFromErrorLog(errorLog[i]);
			},function(){},function(){},true);
	}
	
	console.log("Stored Errors Sent");
	console.log(errorLog);
	
}

function validateToken(){
	connectToServer('validateToken',{'token':token},function(responseData, textStatus, jqXHR) {
				console.log("Token Valid");
				$('#menuSettings').show();
				$('#menuTrackOrder').show();
				$('#menuLogoutBtn').html('<li style="border-bottom-width:2px;"><i class="fa fa-sign-out fa-fw"></i> Log Out</li>');
				$('#menuLogoutBtn').attr('onClick','logout()');
				$('#menuLogoutBtn').attr('href','#');
			},
			function (responseData, textStatus, errorThrown) {
				connectionError(responseData, textStatus, errorThrown, 'validateToken', {"token":token});
				console.log("Token Invalid");
				//$('#menu_btn').hide();
				token=0;
				window.location = "#logIn";
			},
			function(){},true);
			
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
	console.log("Login request sent");
	connectToServer('login',{"email": $("#login_email").val(),"password": $("#login_password").val()},function(responseData, textStatus, jqXHR) {
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
				
				console.log("Login Succesful");
				
			}else{
				$("#login_msg").html(responseData.error);
				console.log("Login error: "+responseData.error);
			}
	    },
		function (responseData, textStatus, errorThrown) {
			console.log("Login Request Failed");
			$("#login_msg").html("Connection Error, Please Try Again Later.");
		},
		function(){},true);
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
	
	$("#register_msg").html("Processing...");
	
	if($("#register_password").val()!=$("#register_confirm_password").val()){
		$("#register_msg").html("Passwords Do Not Match."); 
		console.log("Passwords do not match");
		return "error";
	}

	if(!isEmail($("#register_email").val())){
		$("#register_msg").html("Please Enter A Valid Email Address."); 
		console.log("Invalid email");
		return "error";
	}
	if($("#register_name").val().length < 5){
		$("#register_msg").html("Name to short.");
		console.log("Name too short");
		return "error";
	}
	if($("#register_contactNumber").val().length < 10){
		$("#register_msg").html("Please input a valid contact number.");
		console.log("Invalid contact number");
		return "error";
	}
	
	connectToServer('register',{"email": $("#register_email").val(),
								"password": $("#register_password").val(),
								"contactNumber": $("#register_contactNumber").val(),
								"name": $("#register_name").val()},
					function(responseData, textStatus, jqXHR) {
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
							
							$("#register_msg").html("");
							
							console.log("Registration Successful");
				
						}else{
							$("#register_msg").html(responseData.error);
							console.log("Registration Error : "+responseData.error);
						}
	    			},
					function (responseData, textStatus, errorThrown) {
						$("#register_msg").html("Connection Error, Please Try Again Later.");
						console.log("Registration Request Error : "+errorThrown);
					},
					function(){},true);
}

function forgotPassword(){
	console.log("Sending forgot password request");
	$("#forgotPassword_msg").html("Processing...");
	connectToServer('forgotPassword',{'email':$('#forgotPassword_email').val()},
		function(responseData, textStatus, jqXHR) {
			responseData = JSON.parse(responseData);			
			$("#forgotPassword_msg").html(responseData.msg);
			console.log("Forgot Password returned: "+responseData.msg);
	    },
		function (responseData, textStatus, errorThrown) {
			$("#forgotPassword_msg").html("Connection Error, Please Try Again Later.");
			console.log("Forgot Paswword Request Error: "+errorThrown);
		}, function(){}, true);
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
	
	console.log("Getting Profile Settings");
	
	window.location = '#profileSettings';
	$("#settings_msg").html("Loading...");
	connectToServer('getProfile',{},
		function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				$("#settings_name").val(responseData.name);
				$("#settings_contactNumber").val(responseData.contactNumber);
				$("#settings_email").val(responseData.email);
				$("#settings_msg").html(' ');
				console.log("Getting Profile Settings Succesful");
	    	},
		function (responseData, textStatus, errorThrown) {
			console.log("Getting Profile Settings Error");
			$("#settings_msg").html("Connection Error, Please Try Again Later.");
			connectionError(responseData,textStatus,errorThrown,'getProfile','{}');
			},
		function(){},true);
	
		
}

function updateProfile(){
	if($("#settings_name").val().length < 5){
		$("#settings_msg").html("Name to short.");
		console.log("Name to short");
		return false;
	}
	if($("#settings_contactNumber").val().length < 10){
		$("#settings_msg").html("Please input a valid contact number.");
		console.log("Invalid contact number");
		return false;
	}
	if(!isEmail($("#settings_email").val())){
		$("#settings_msg").html("Please input a valid email address.");
		console.log("Invalid email");
		return false;
	}
	
	console.log("Sending profile update");
	$("#settings_msg").html("Processing...");
	
	connectToServer('updateProfile',{"name": $("#settings_name").val(),"email": $("#settings_email").val(),"contactNumber": $("#settings_contactNumber").val()},
		function(responseData, textStatus, jqXHR){
			$("#settings_msg").html("Profile Succefully Updated.");
			console.log("Profile Succedfully Upddated");
	    },
		function (responseData, textStatus, errorThrown) {
			$("#settings_msg").html("Connection Error, Please Try Again Later.");
			console.log("Profile Update Failed: "+errorThrown);
			connectionError(responseData,textStatus,errorThrown,'updateProfile',{"name": $("#settings_name").val(),"email": $("#settings_email").val(),"contactNumber": $("#settings_contactNumber").val()});
		},
		function(){},true);
}

function changePassword(){
	if($("#changePassword_new_password").val().length<8){
		$("#changePassword_msg").html("Your password must be 8 characters or longer.");
		console.log("Password not long enough");
		return false;
	}
	
	if($("#changePassword_new_password").val() != $("#changePassword_confirm_new_password").val()){
		$("#changePassword_msg").html("Confirmation password does not match new password.");
		console.log("New passwords do not match");
		return false;
	}
	
	console.log("Sending password update request");
	$("#changePassword_msg").html("Processing...");
	connectToServer('changePassword',{"oldPassword": $("#changePassword_old_password").val(),"newPassword": $("#changePassword_new_password").val()},
		function(responseData, textStatus, jqXHR){
			responseData = JSON.parse(responseData);
			$("#changePassword_msg").html(responseData.msg);
			console.log("Password update request successful");
	    },
		function (responseData, textStatus, errorThrown) {
			$("#changePassword_msg").html("Connection Error, Please Try Again Later.");
			console.log("Password update request error: "+errorThrown);
			connectionError(responseData,textStatus,errorThrown,'changePassword',{"oldPassword": $("#changePassword_old_password").val(),"newPassword": $("#changePassword_new_password").val()});
		},
		function(){},true);
		
}

function loadProducts(filter){
	$("#productListContainer").html('<div id="loadingProducts">Loading...</div>');
	console.log('Loading Products for '+filter);
	connectToServer('products',{'filter':filter},
		function(responseData, textStatus, jqXHR) {
			responseData = JSON.parse(responseData);
			clearProducts();
			$.each(responseData, function(key, data){
				addProductItem(data);
			});
			console.log('Loading Products for '+filter+' successful');
		},
		function (responseData, textStatus, errorThrown) {
			console.log('Loading Products for '+filter+' failed');
			connectionError(responseData, textStatus, errorThrown,'products',{'filter':filter});
		},
		function(){},true);
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
	//switch to product page
	window.location = '#products';
	//update product page title
	$('#products_title').html(title);
	loadProducts(filter);
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
	
	console.log("Sending product information request");
	
	connectToServer('product',{'productID': itemID},
		function(responseData, textStatus, jqXHR) {
			responseData = JSON.parse(responseData);
			$.each(responseData, function(key, data){
				$("#addToCartImg").attr('src',responseData.image);
				$("#addToCartTitle").html(responseData.title);
				$("#addToCartStock").html('Stock: '+responseData.stock);
				$("#addToCartPrice").html('Price: R'+responseData.price+' '+responseData.priceDes);
				$("#addToCartBtn").attr('onclick','addToCart('+responseData.itemID+','+responseData.price+','+responseData.stock+')');
				addToCartMax = responseData.stock;
				$("#addToCartAddNumber").html(parseInt($("#cartCountLabel"+responseData.itemID).html()));
				console.log("Product information request successful");
			});
		},
		function (responseData, textStatus, errorThrown) {
			console.log("Product information request failed: "+errorThrown);
			connectionError(responseData,textStatus,errorThrown,'product',{'productID':itemID});	
		},
		function(){},true);
	
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
	console.log("Sending order to server");
	connectToServer('createOrder',{'products':cart},
		function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				orderID = responseData.orderID;
				localStorage.orderID = orderID;
				console.log("Order successfully created - order number "+orderID);
			},
		function (responseData, textStatus, errorThrown) {
			console.log("Order creation failed: "+errorThrown);
			connectionError(responseData,textStatus,errorThrown,'createOrder',{'products':cart});
			},
		function(){},true);
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
	
	console.log("Add drop off location to order");
	connectToServer('addDropOffLocation',{'location':location,'orderID':orderID},
		function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				if(responseData.requiresDeliveryFee==0){requiresDeliveryFee=false;}else{requiresDeliveryFee=true;}
				deliveryFee = responseData.deliveryFee;
				deliveryDate = responseData.deliveryDate;
				console.log("Drop off location add sucessfully - Delivery Fee R"+deliveryFee);
				confirmOrder(responseData.location);
	    	},
		function (responseData, textStatus, errorThrown) {
			console.log("Failed to add drop off location to order");
			connectionError(responseData,textStatus,errorThrown,'addDropffLocation',{'location':location,'orderID':orderID});
			},
		function(){},true);
}

function cancelOrder(){
	window.location = "#myBag";	
	console.log("Cancel Order "+orderID);
	connectToServer('cancelOrder',{'orderID':orderID},
		function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				console.log("order "+orderID+" succefully cancelled");
				orderID = 0
				localStorage.orderID=0;
				localStorage.removeItem('orderID');
	    	},
		function (responseData, textStatus, errorThrown) {
			console.log("order "+orderID+" failed to cancel");
			orderID = 0
			localStorage.orderID=0;
			localStorage.removeItem('orderID');
			connectionError(responseData,textStatus,errorThrown,'cancelOrder',{'orderID':orderID});
			},
		function(){},true);
}

function proceed(){
	if(isLogedIn()==false){return 0;}
	createOrder();
	window.location = "#selectDropOffLocation";	
}

function confirmOrder(location){
	
	//Change page information
	$('#confirm_title').html("Confirm Order");
	$('#confirmOrderCreditCardBtn').show(0);
	$('#confirmOrderEFTBtn').show(0);
	$('#confirmOrderCancelBtn').html('Cancel Order');
	$('#confirmOrderCancelBtn').attr('onClick','cancelOrder()');
	
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
	$('#confirmOrderDeliveryDate').html('<label class="title">Delivery Date: </label><label>'+deliveryDate+'</label>');
	
	$('#confirmOrderEFTBtn').attr('onClick','checkoutWithEFT('+total+')');
	
	window.location = "#confirmOrder";
}

function checkout(){
	//payOrder('NEW');
	$('#cards').html('Loading...');
	window.location = '#selectCard';
		
	console.log("Request card list");
	connectToServer('getCards',{},
		function(responseData, textStatus, jqXHR){
			responseData = JSON.parse(responseData);
			$('#cards').html('');
			console.log("Get card list successful");
			$.each(responseData, function(index, value){
					//console.log(value[0]); Display all card data
					var imagePath;
					//select correct image
					if(value[0].cardType=='Visa'){
						imagePath = 'visalg.png';
					}else if(value[0].cardType=='MasterCard'){
						imagePath='MCard.jpg';
					}else{
						imagePath = 'american-express-logo4.jpg';
					}
					// Add card to list
					$('#cards').append('<label><input type="radio" value="'+value[0].cardVaultID+'" name="card"><div class="card"><img src="images/'+imagePath+'" /><b>'+value[0].cardNumber+'</b></div></label>');
							
				});
			$('#cards').append('<label><input type="radio" value="NEW" name="card"><div class="card">Add New Card.</div></label>');
					
		},
		function (responseData, textStatus, errorThrown){
			console.log("Get card list error: "+errorThrown);
			connectionError(responseData, textStatus, errorThrown, 'getCards',{});
		},
		function(){},true);
	

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
	
	console.log("Request card information");
	connectToServer('getCard',{'vaultID':cardVault},
		function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				$('#paymentCardNumber').val(responseData.cardNumber);
				$('#paymentMonth').val(responseData.cardExpiryDate.substring(0,2));
				$('#paymentYear').val(responseData.cardExpiryDate.substring(2));
				console.log("Card information request succesful");
	    	},
		function (responseData, textStatus, errorThrown){
			console.log("Card information request failed");
			connectionError(responseData, textStatus, errorThrown, 'getCard', {'vaultID':cardVault});
			},
		function(){}, true);
	
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
	
	$('#paymentContinueBtn').removeAttr('onClick');
	$('#paymentContinueBtn').attr('disable','disable');
	
	connectToServer('payForOrder',{"orderID":orderID,"cardVaultID":cardVaultID,"cardNumber": $('#paymentCardNumber').val(),"cardExpiryDate": $('#paymentMonth').val()+$('#paymentYear').val(),"cvv": $('#paymentCVV').val(),"name": $('#paymentFirstName').val()+' '+$('#paymentLastName').val()},
		function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				if(responseData.msg=='Success'){
					$('#paymentCompleteTitle').html('Payment Complete');
					$('#paymentCompleteContent').html('Your order has been successfully completed. You can check on order at any time using <b>Track Order</b> option in the menu bar.');	
					$('#paymentCompleteBtns').html('<button onClick="window.location = '+"'#homeScreen'"+'">Done</button>');
					window.location = '#paymentComplete';
					clearCart();
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
				$('#paymentContinueBtn').attr('onClick','payOrder()');
				$('#paymentContinueBtn').removeAttr('disabled');
	    	},
		function (responseData, textStatus, errorThrown) {
			connectionError(responseData,textStatus,errorThrown,'payForOrder',{"orderID":orderID,"cardVaultID":cardVaultID,"cardNumber": $('#paymentCardNumber').val(),"cardExpiryDate": $('#paymentMonth').val()+$('#paymentYear').val(),"cvv": $('#paymentCVV').val(),"name": $('#paymentFirstName').val()+' '+$('#paymentLastName').val()});
			},
		function(){},true);
}

function checkOrderStatus(){
	if(orderID==0){return 0}
	var output = 0;
	console.log("Checking status of order "+orderID);
	connectToServer('checkOrderStatus',{'orderID':orderID},
		function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				output = responseData.status;
				console.log(responseData);
		},
		function (responseData, textStatus, errorThrown){
			console.log('Checking order status failed');
			connectionError(responseData, textStatus, errorThrown, 'checkOrderStatus',{'orderID':orderID});
		},
		function(){},false);
	
	return output;
}

function updateStock(){
	console.log("Sending stock update request");
	connectToServer('updateStock',{'orderID':orderID},
		function(responseData, textStatus, jqXHR){
			responseData = JSON.parse(responseData);
			console.log('Stock update request sent');
		},
		function (responseData, textStatus, errorThrown){
			console.log('Stock update request failed');
			connectionError(responseData, textStatus, errorThrown, 'updateStock',{'orderID':orderID});
		},
		function(){}, false);
}

function addTrackingInfo(orderID){
	//get order info
	var status = 0;
	var dropoff = '';
	console.log('Requestion tracking information for order '+orderID);	
	connectToServer('getOrderInfo',{'orderID':orderID},
		function(responseData, textStatus, jqXHR){
			responseData = JSON.parse(responseData);
			orderID = responseData.orderID;
			status = responseData.status;
			dropoff = responseData.dropoff;
			console.log('Tracking information for order '+orderID+' successful');
		},
		function (responseData, textStatus, errorThrown){
			console.log('Tracking information for order '+orderID+' failed');
			connectionError(responseData, textStatus, errorThrown,'getOrderInfo',{'orderID':orderID});
		},
		function(){},false);
		
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
		'<div align="center"><button style="margin-bottom: 10px;" onClick="viewOrder('+orderID+')">View Order</button></div>'+
		'</div>'
		);
	
}

function updateTracking(){
	$('#menu_btn').show(250);
	disableMenu=false;
	
	var orderList = null;
	//clear tracking page
	$('#trackingContainer').html('<h2>Loading...</h2>');
	window.location = '#trackOrder';
	closeMenu();

	setTimeout(function(){
		//get list of all active orders	
		console.log('Request list of orders for tracking');
		connectToServer('getTrackingOrders',{},
			function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				orderList = responseData.orderList;	
				console.log('List of orders for tracking succesfully recieved');
			},
			function(responseData, textStatus, errorThrown){
				console.log('List of orders for tracking succesfully recieved');
				connectionError(responseData, textStatus, errorThrown,'getTrackingOrders',{});
			},
			function(){},false);
			
		//add order list to tracking page
		if(orderList.length>0){$('#trackingContainer').html('');}else{$('#trackingContainer').html('<h2>No Orders</h2>');}
		$.each(orderList,function(index, value){addTrackingInfo(value);});
	},100);

	$('#cartButton').hide(250);
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
			error: function (responseData, textStatus, errorThrown) {
				connectionError(responseData, textStatus, errorThrown,'newsletter.php',{});
				}
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
			error: function (responseData, textStatus, errorThrown){
				connectionError(responseData, textStatus, errorThrown,'story.php',{});
				}
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
	console.log("Get address list");
	connectToServer('getAddressList',{},
		function(responseData, textStatus, jqXHR){
					responseData = JSON.parse(responseData);
					console.log("Get address list succesful");
					//get addresses from server
					$('#addressSelect').html('<option value="NEW" selected >Add New Address</option>');
					$.each(responseData.addresses,function(index,value){
						$('#addressSelect').append('<option value="'+value.addressID+'">'+value.addressLine1+'</option>');
					});
					window.location = "#selectAddress";
	    	},
		function(responseData, textStatus, errorThrown){
			console.log("Get address list failed");
			connectionError(responseData, textStatus, errorThrown, 'getAddressList',{});
			},
		function(){},true);
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
	console.log('Get address request');
	connectToServer('getAddress',{'addressID':addressID},
		function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				console.log('Get address successful');
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
		function(responseData, textStatus, errorThrown){
			console.log('Get address failed');
			connectionError(responseData, textStatus, errorThrown, 'getAddress',{'addressID':addressID});
			},
		function(){},true);
}

function addAddress(){
	console.log('Add address');
	connectToServer('addAddress',{"addressLine1":$('#addressLine1').val(),"addressLine2":$('#addressLine2').val(),"suburb":$('#addressSuburb').val(),"city":$('#addressCity').val(),"province":$('#addressProvince').val(),"country":$('#addressCountry').val(),"postalCode":$('#addressPostalCode').val()},
	function(responseData, textStatus, jqXHR){
			console.log('Add address successful');
		},
	function(responseData, textStatus, errorThrown){
			console.log('Add address failed');
			connectionError(responseData, textStatus, errorThrown, 'addAddress',{"addressLine1":$('#addressLine1').val(),"addressLine2":$('#addressLine2').val(),"suburb":$('#addressSuburb').val(),"city":$('#addressCity').val(),"province":$('#addressProvince').val(),"country":$('#addressCountry').val(),"postalCode":$('#addressPostalCode').val()});
		},
	function(){},true);
}

function viewOrder(orderID){
	//Change page information
	$('#confirm_title').html("View Order "+orderID);
	$('#confirmOrderCreditCardBtn').hide(0);
	$('#confirmOrderEFTBtn').hide(0);
	$('#confirmOrderCancelBtn').html('Done');
	$('#confirmOrderCancelBtn').attr('onClick','updateTracking()');
	
	$("#confirmOrderCartTable").html('<tr><td><h2>Loading</h2></td></tr>');
	
	connectToServer('getOrder',{"orderID":orderID},
		function(responseData, textStatus, jqXHR){
			responseData = JSON.parse(responseData);
			var total = 0;
			
			//Products table header
			$("#confirmOrderCartTable").html('<tr id="confirmOrderTitleRow">'+
												'<td class="confirmOrderCol1">Item</td>'+
												'<td class="confirmOrderCol3">Amount</td>'+
												'<td class="confirmOrderCol4">Price</td>'+
											'</tr>');
			//loop throough products and add them to the table
			var cart = responseData.products;
			for(i=0;i<cart.length;i++){
				total = total+(cart[i].price*cart[i].amount);
				$("#confirmOrderCartTable").append('<tr>'+
					'<td class="confirmOrderCol1">'+cart[i].title+'</td>'+
					'<td id="amount-'+i+'" align="center">'+cart[i].amount+'</td>'+
					'<td id="price-'+i+'" align="left">R'+(cart[i].price*cart[i].amount)+'</td>'+
					'</tr>'	);
			}
			
			//deposit
			$("#confirmOrderCartTable").append('<tr>'+
												'<td colspan="2">Bag Deposit</td>'+
												'<td style="border-top:black 1px solid;" align="left">R0</td>'+
												'</tr>');
												
			//delivery fee
			$("#confirmOrderCartTable").append('<tr>'+
													'<td colspan="2">Delivery Fee</td>'+
													'<td align="left">R'+responseData.deliveryFee+'</td>'+
												'</tr>');
			
			//Order total
			$("#confirmOrderCartTable").append('<tr id="confirmOrderTitleTotalRow"><td></td><td></td><td>Total</td></tr>');
			$("#confirmOrderCartTable").append('<tr><td><td></td></td>'+
													'<td id="confirmOrderTotal" align="left">R'+responseData.total+'</td>'+
												'</tr>');
			
			//Drop off location
			$('#confirmOrderDropOffPoint').html('<label class="title">Drop Off Point: </label>'+
													'<label>'+responseData.dropOffLocation+'</label>');
			
			//Delivery date
			$('#confirmOrderDeliveryDate').html('<label class="title">Delivery Date: </label>'+
													'<label>'+responseData.deliveryDate+'</label>');
			//go to orders confirmation page
			window.location = "#confirmOrder";	
		},
		function(responseData, textStatus, errorThrown){
			connectionError(responseData,textStatus,errorThrown,'getOrder',{'orderID':orderID});
		},
		function(){},true);

}

function checkoutWithEFT(total){
	//update EFT Details
	$('#eftDetails').html('Please make EFT your order payment to us and send us the proof of payment to confirm your order.'+
					'<h3>Bank</h3>'+
					'Standard Bank'+
					'<h3>Account Number</h3>'+
					'07 084 3716'+
					'<h3>Branch</h3>'+
					'Thibault Square Branch'+ 
					'<h3>Branch Code</h3>'+
					'020 909'+
					'<h3>Amount</h3>'+
					'R'+total+
					'<h3>Reference</h3>'+
					'Order#'+orderID+
					'<p><b>Please email your proof of payment to '+
					'orders@inglenookfarm.co.za</b></p>');
					
					
	window.location = '#EFTDetails';
	
	connectToServer('changePaymentType',{'orderID':orderID,'paymentType':'EFT'},
		function(responseData, textStatus, jqXHR){
				$('#eftBtns').html('<button onClick="clearCart()">Done</button>');
			},
		function(responseData, textStatus, errorThrown){
				connectionError(responseData,textStatus,errorThrown,'changePaymentType',{'orderID':orderID,'paymentType':'EFT'});
			},
		function(){},true);
}

function goToSeasonalBag(){
	window.location = "#SeasonalVeg";
	$('#seasonalvegDescription').html('<h2>Loading...</h2>');
	
	if(cart.length>0){
		$('#cartButton').show(250);
	}
	
	connectToServer('getSeasonalBag',{},
		function(responseData, textStatus, jqXHR){
				responseData = JSON.parse(responseData);
				$('#seasonalvegDescription').html('<img src="'+responseData.imagePath+'"/>');
				$('#seasonalvegDescription').append('<label>'+responseData.description+'</label>');
				$('#seasonalvegDescription').append('<h3>The seasonal vegetable bag contains:</h3>');
				$('#seasonalvegDescription').append('<ul>');
				$.each(responseData.products, function(index, value){
					$('#seasonalvegDescription').append('<li>'+value.amount+' x '+value.title+'</li>');
				});
				$('#seasonalvegDescription').append('</ul>');
				$('#seasonalvegDescription').append('<h3>Price: R'+responseData.price+'</h3>');
				
				seasonalBagPrice = responseData.price;
				seasonalBagStock = responseData.stock;
				
				$('#seasonalBagAddToCartBtn').attr('onClick','addSeasonalBagToCart()');
				
			},
		function(responseData, textStatus, errorThrown){
				connectionError(responseData,textStatus,errorThrown,'changePaymentType',{'orderID':orderID,'paymentType':'EFT'});
			},
		function(){},true);
}

function addSeasonalBagToCart(){
	$('#addToCartTitle').html('Seasonal Vegetable Bag');
	$('#addToCartAddNumber').html(1);
	addToCart(1,seasonalBagPrice,seasonalBagStock);
	
	
}
