type Location = {
    coords: {
      latitude: number;
      longitude: number;
    };
  };


export default async function getCurLocation(){
    return new Promise<Location>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            let pos:Location={coords:{latitude:position.coords.latitude,longitude:position.coords.longitude}};
            console.log("Current position:", pos);
            resolve(pos); // Resolve the promise with the position
          },
          (error) => {
            console.error("Error getting location:", error);
            reject(error); // Reject the promise if there's an error
          },
          {enableHighAccuracy: true, timeout: 5000, maximumAge: 0}
        );
      } else {
        reject(new Error("Browser doesnt support GPS"));
      }
    });
  };

