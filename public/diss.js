setTimeout(() => {
  $(".message").fadeOut("fast");
}, 2000);

window.onscroll = function() {
  myFunction();
};
var navbar = document.getElementById("navbar");
var sticky = navbar.offsetTop;

function myFunction() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky");
  } else {
    navbar.classList.remove("sticky");
  }
}
function openNav() {
  document.getElementById("myNav").style.display = "block";
}
function closeNav() {
  document.getElementById("myNav").style.display = "none";
}

// Search work
var search = document.querySelector(".fieldSearch")
var display = document.querySelector('.searchItems')

search.addEventListener("keypress", () => {
  // console.log('yipppee')
  var xhr = new XMLHttpRequest()
  xhr.open("GET", "/?name=" + search.value, true)
  
  xhr.onload = function() {
    
    var results = JSON.parse(this.responseText)
    results.map(r => {
      display.innerHTML += `<li>${r}</li>`
    })
  };
  xhr.send()
})
