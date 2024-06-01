function submitForm(event) {
    event.preventDefault();
    var formData = $('#myForm').serialize();
    $.ajax({
        url: '/validate',
        type: 'POST',
        data: formData,
        success: function(response)
        {
            document.getElementById("myresponse").innerHTML=response.message;
            document.getElementById('myForm').reset();
        },
        error: function(xhr, status, error){
			document.getElementById("myresponse").innerHTML=error;
        }  
    });
}

function submitLogin(event) {
    event.preventDefault();
    var formData = $('#myForm').serialize();
    $.ajax({
        url: '/validatelogin',
        type: 'POST',
        data: formData,
        success: function(response,status,xhr){
            document.getElementById('myForm').reset();
            if(xhr.status==200){
			window.location.href = "/app";

            }
        },
        error: function(xhr, status, error){
            document.getElementById("myresponse").innerHTML="User/Password Incorrect";
        }
    });
}


document.getElementById('upload-photo').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-image').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});
