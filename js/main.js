$(document).ready(function() {
  $(".nav-icon").click(function() {
    console.log("good")
    $(".full-nav").addClass("open");
  });

  $(".nav-close").click(function() {
    console.log ("close")
    $(".full-nav").removeClass("open");
  });

  $(window).scroll(function() {
    var sc = $(window).scrollTop();
    if (sc > 100) {
      $(".nav").addClass("sticky");
    }
    else {
      $(".nav").removeClass("sticky");
    }
  });
});
