// client-side js
// run by the browser each time your view template referencing it is loaded
//
console.log("hello and hahalan 🍔");

let dreams = [];

// define variables that reference elements on our page
const dreamsList = document.getElementById("dreams");
//const dreamsForm = document.forms[0];
//const dreamInput = dreamsForm.elements['dream'];

// a helper function to call when our request for dreams is done
const getDreamsListener = function() {
  // parse our response to convert to JSON
  dreams = JSON.parse(this.responseText);

  // iterate through every dream and add it to our page
  dreams.forEach(function(row) {
    appendNewDream(row);
  });
};

// request the dreams from our app's sqlite database
const dreamRequest = new XMLHttpRequest();
dreamRequest.onload = getDreamsListener;
dreamRequest.open("get", "/getStats");
dreamRequest.send();

// a helper function that creates a list item for a given dream
const appendNewDream = function(stats) {
  const newListItem = document.createElement("li");
  newListItem.innerHTML =
    "<b>Gap:</b> " +
    stats.total +
    " sec.<br><b>Msg:</b> " +
    stats.comment +
    " <br><b>Updated:</b> " +
    stats.updatedAt;
  dreamsList.appendChild(newListItem);
};
