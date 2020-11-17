const typeCompletionButton = document.querySelector("#typeCompletionButton");
const clearButton = document.querySelector("#clearButton");
const removePin = document.querySelector("#removePin");
let binType;
let currSize = 0;
let markerLng = [];
let markerLat = [];
let centerLoc = {};
let locationArray = [];
let viewRadius = 0.01; //1km Default
let markers = [];
let bins = [];

let garbageIcon;
//  = "images/bins/garbage-bin.svg";
let recycleIcon;
//  = "images/bins/recycle-bin.svg";
let blankBinIcon;
//  = "images/bins/blank-bin.svg";
let iconPackChoice;

let lng;
let lat;
let userLng;
let userLat;
let markerSet = false;

//-----------------------------------------------------------------------------
// Page Load and Logo Fade
//-----------------------------------------------------------------------------

//Intial loadout for non-map members and bins
window.addEventListener("load", function () {
  document.querySelector("#mainApp").style.visibility = "visible";
  setTimeout(() => {
    renderPins(viewRadius);
    $(".loaderContainer").animate(
      {
        top: "-100vh",
      },
      "slow"
    );
  }, 300);
  setTimeout(() => {
    $(".loaderContainer").remove();
  }, 1000);
  setTimeout(
    () => (document.querySelector("#mainApp").style.visibility = "visible"),
    1200
  );
});

function pageLoad() {
  $("#iconPackModal").modal("hide");
  $("#iconPackModal").modal("show");
}

//Adjusts view distance based on radio button data
function changeViewDistance() {
  const distance = $("input[name=viewDistance]:checked").val();
  if (distance === "5km") {
    viewRadius = 0.05;
    reloadPins(viewRadius);
  } else if (distance === "2km") {
    viewRadius = 0.02;
    reloadPins(viewRadius);
  } else {
    viewRadius = 0.01;
    reloadPins(viewRadius);
  }
}

//-----------------------------------------------------------------------------
// Tom Tom Map Load (in combination with tomtom_api.js)
//-----------------------------------------------------------------------------

//TomTom popup offsets
let popupOffsets = {
  top: [0, 0],
  bottom: [0, -70],
  "bottom-right": [0, -70],
  "bottom-left": [0, -70],
  left: [25, -35],
  right: [-25, -35],
};

//-----------------------------------------------------------------------------
// Continuously gets user location.
//-----------------------------------------------------------------------------

function getLocation() {
  navigator.geolocation.watchPosition(showLocation);

  function showLocation(position) {
    userLat = position.coords.latitude;
    userLng = position.coords.longitude;
    document.querySelector("#currentLocSelect").style.opacity = "100%";
    document.querySelector("#currentLocSelect").disabled = false;
  }
}

//-----------------------------------------------------------------------------
// Moveable Marker to add bin to map.
//-----------------------------------------------------------------------------

let placePin = true;

document.querySelector("#placePin").onclick = moveableMarker;

var moveablePin;

//created movable marker DOM element with associated popup and hide feature.
function moveableMarker() {
  let blankBin = createBinElement(3); //creates DOM element for moveable marker

  var center = map.getCenter();
  var popup = new tt.Popup({
    offset: 35,
  });
  moveablePin = new tt.Marker({
    draggable: true,
    element: blankBin,
  })
    .setLngLat(center)
    .addTo(map);

  function onDragEnd() {
    var lngLat = moveablePin.getLngLat();
    markerLng.push(lngLat.lng);
    markerLat.push(lngLat.lat);
    popup.setHTML(lngLat.toString());
    popup.setLngLat(lngLat);
    moveablePin.setPopup(popup);
    moveablePin.togglePopup();
  }
  moveablePin.on("dragend", onDragEnd);
  hide();
  markerSet = true;
  document.querySelector("#placePin").onclick = "";
}

//Hides bins
function hide() {
  document.querySelector("#removePin").addEventListener("click", function () {
    document.querySelector("#removePin").onclick = hidePin(moveablePin);
    markerSet = false;
  });

  document
    .querySelector("#typeCompletionButton")
    .addEventListener("click", function () {
      document.querySelector("#typeCompletionButton").onclick = hidePin(
        moveablePin
      );
      markerSet = false;
      $("#binTypeSelector").modal("hide");
    });
}

//Removes all bins currently on the map.
function hidePin(marker) {
  markerSet = false;
  marker.remove();
  document.querySelector("#placePin").onclick = moveableMarker;
}

//Reloads bins based on current firebase data
function showPin(docSelection, markerChoice, popupChoice) {
  markerChoice.setLngLat(docSelection.data().loc).addTo(map);
  if (docSelection.data().type == "recycle") {
    markerChoice.element = recycleIcon;
  }
  popupChoice.setHTML("" + docSelection.data().name);
}

//-----------------------------------------------------------------------------
// Get/Add/Update Pins in Firebase
//-----------------------------------------------------------------------------

//Renders bins from db
function renderPins(displayLimit) {
  if (markers.length > 0) {
    markers.forEach((pin) => {
      pin.remove();
    });
  }
  markers = [];
  centerLoc = map.getCenter();
  bins = [];
  if (window.sessionStorage.userData == null) {
    setTimeout(function () {
      renderPins(displayLimit);
    }, 250);
    return;
  }
  iconSelect(JSON.parse(window.sessionStorage.userData).iconPack);
  db.collection("bins")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.exists) {
          if (
            Math.abs(doc.data().loc[0] - centerLoc.lng) <= displayLimit &&
            Math.abs(doc.data().loc[1] - centerLoc.lat) <= displayLimit
          ) {
            createMarker(doc);
            bins.push(doc);
            locationArray.push([doc.data().loc[0], doc.data().loc[1]]);
          }
        }
      });
    })
    .catch(function (error) {
      console.log("Error getting document:" + error);
    });
}

//Reloads bins based on local data
function reloadPins(displayLimit) {
  if (markers.length > 0) {
    markers.forEach((pin) => {
      pin.remove();
    });
  }
  markers = [];
  centerLoc = map.getCenter();
  bins.forEach((doc) => {
    if (
      Math.abs(doc.data().loc[0] - centerLoc.lng) <= displayLimit &&
      Math.abs(doc.data().loc[1] - centerLoc.lat) <= displayLimit
    ) {
      createMarker(doc);
    }
  });
}

// Creates Bin and Corresponding Popup based on firebase data
function createMarker(doc) {
  let popup = new tt.Popup({
    offset: popupOffsets,
  });
  let marker = new tt.Marker();
  if (doc.data().type == "garbage") {
    let garbageBin = createBinElement(1);
    marker = new tt.Marker({
      element: garbageBin,
    });
  } else if (doc.data().type === "recycle") {
    let recycleBin = createBinElement(2);
    marker = new tt.Marker({
      element: recycleBin,
    });
  }
  markers.push(marker);
  marker.setLngLat(doc.data().loc).addTo(map);
  popup.setHTML(
    "<h4>" +
      doc.data().type +
      " bin</h4><p class='popup-details'>Details:" +
      doc.data().description +
      "</p"
  );
  marker.setPopup(popup);
  document.querySelector("#hidePins").addEventListener("click", function () {
    hidePin(marker);
  });
  document.querySelector("#showPins").addEventListener("click", function () {
    showPin(doc, marker, popup);
  });
}

//Creates DOM element for bin marker.
// type 1 is garbage, 2 is recycle, 3 is blank
function createBinElement(type) {
  switch (type) {
    case 1:
      let garbageBin = document.createElement("img");
      garbageBin.setAttribute("src", garbageIcon);
      garbageBin.setAttribute("class", "garbageBin");
      return garbageBin;
    case 2:
      let recycleBin = document.createElement("img");
      recycleBin.setAttribute("src", recycleIcon);
      recycleBin.setAttribute("class", "recycleBin");
      return recycleBin;
    case 3:
      let blankBin = document.createElement("img");
      blankBin.setAttribute("src", blankBinIcon);
      blankBin.setAttribute("class", "blankBin");
      return blankBin;
  }
}

//Selects bin icons based on user selection
function iconSelect(selection) {
  switch (selection) {
    case 1:
      garbageIcon = "images/bins/garbage-bin.svg";
      recycleIcon = "images/bins/recycle-bin.svg";
      blankBinIcon = "images/bins/blank-bin.svg";
      break;
    case 2:
      garbageIcon = "images/bins/garbage-bin-2.svg";
      recycleIcon = "images/bins/recycle-bin-2.svg";
      blankBinIcon = "images/bins/blank-bin-2.svg";
      break;
    case 3:
      garbageIcon = "images/bins/garbage-bin-3.svg";
      recycleIcon = "images/bins/recycle-bin-3.svg";
      blankBinIcon = "images/bins/blank-bin-3.svg";
      break;
  }
}

//-----------------------------------------------------------------------------
//Request Bin Feature

// Excecutes processes related to user recycle bin request
function chooseRecycle() {
  // document.getElementById("recycle-svg").src = "images/bins/garbage-bin.svg";
  document.getElementById("recycle-svg").style.opacity = 0.2;
  document.getElementById("garbage-svg").style.opacity = 0.5;
  setTimeout(clickResponse, 100, "recycle-svg");
  binType = "recycle";
  document.querySelector("#typeCompletionButton").disabled = false;
  return binType;
}

// Excecutes processes related to user garbage bin request
function chooseGarbage() {
  document.getElementById("garbage-svg").style.opacity = 0.2;
  document.getElementById("recycle-svg").style.opacity = 0.5;
  setTimeout(clickResponse, 100, "garbage-svg");
  binType = "garbage";
  document.querySelector("#typeCompletionButton").disabled = false;
  return binType;
}

// Event handler for user bin choice during bin request
function clickResponse(id) {
  document.getElementById(id).style.opacity = 1;
  if (id === "recycle-svg") {
    document.getElementById(id).src = "images/bins/recycle-bin-2.svg";
  } else if (id === "garbage-svg") {
    document.getElementById(id).src = "images/bins/garbage-bin-3.svg";
  }
}

//Handles user request to add pin at location or at marker.
//Also Hides Request Bin Modal.
getLocation();

function requestBin(type) {
  switch (type) {
    case 1:
      lng = userLng;
      lat = userLat;
      break;
    case 2:
      lng = markerLng.pop();
      lat = markerLat.pop();
      break;
  }
  $("#requestBin").modal("hide");
}

//Checks if marker has been placed then activates request bin at marker button.
function checkRequestPin() {
  if (markerSet) {
    document.querySelector("#markerSelect").style.opacity = "100%";
    document.querySelector("#markerSelect").disabled = false;
  } else {
    document.querySelector("#markerSelect").style.opacity = "30%";
    document.querySelector("#markerSelect").disabled = true;
  }
}

//-----------------------------------------------------------------------------
// Preferences Modal
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------

$(".iconpack-container").on("click", function () {
  $(".iconpack-container").removeClass("iconpack-selected");
  $(this).toggleClass("iconpack-selected");
});

function setIcons(selection) {
  iconPackChoice = selection;
}

function setPreferences() {
  const newName = $("#displayNameEdit").val();
  // const notify = $("input[name=notificationsSlider]:checked").val(); //Not implemented
  updateUser(newName, true, iconPackChoice).then(() => location.reload());
}
