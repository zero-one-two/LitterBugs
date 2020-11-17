const THRESHOLD = 0.0001;

//Adds bin to db and forces reload
function setBin() {
    $('#requestMessageModal').modal('hide');
    const description = $("#requestMessage").val();
    if (checkLoc(lng, lat)) {
        if (binType === "recycle") {
            const locToSave = [lng, lat];
            const nameToSave = "Recycling Bin";
            db.collection("bins").add({
                loc: locToSave,
                name: nameToSave,
                type: binType,
                user: JSON.parse(sessionStorage["userData"]).name || "",
                description: description || "",
                isVerified: false
            }).then(function () {
                location.reload();
            }).catch(function () {
                console.log("Error: " + err);
                location.reload();
            });
        } else if (binType === "garbage") {
            const locToSave = [lng, lat];
            const nameToSave = "Garbage Bin";
            db.collection("bins").add({
                loc: locToSave,
                name: nameToSave,
                type: binType,
                user: JSON.parse(sessionStorage["userData"]).name || "",
                description: description || "",
                isVerified: false
            }).then(function () {
                location.reload();
            }).catch(function () {
                console.log("Error: " + err);
                location.reload();
            });
        }
    } else {
        alert("The is already a bin here!");
        return;
    }
}

//Checks if bin matches search radius specified 
function checkLoc(longitude, latitude) {

    for (let i = 0; i < locationArray.length; i++) {
        let diffLong = Math.abs(longitude - locationArray[i][0]);
        let diffLat = Math.abs(latitude - locationArray[i][1])
        if (diffLong < THRESHOLD && diffLat < THRESHOLD) {
            return false;
        }

    }
    return true;
}


//Increments bin count and sets value in firebase 'CurrentSize' document*/
function setCount(oldSize, doc) {
    currSize = oldSize + 1;
    doc.set({
        size: currSize
    });
}

//Returns all bins from db
function getBins(userName) {
    let binName;
    const ArraySize = db.collection("ArraySize").doc("CurrentSize");
    ArraySize.get().then(function (doc) {

        currSize = doc.data().size;

        /* Gets name of each bin document currently stored */
        for (let i = 0; i <= currSize; i++) {
            binName = "bin" + i;
            getPin(binName);
        }
    });
}



