import type { PosData } from "../data/mapData";

export function geoLocation(callback: (data: Array<PosData>) => void) {
    function addPos(ps: GeolocationPosition) {
        let x = ps.coords.longitude;
        let y = ps.coords.latitude;
        let z = ps.coords.altitude;
        ps.coords.altitudeAccuracy
        let pos_data: PosData = {
            type: "local",
            uuid: "0",
            name: "本地定位",
            x,
            y,
            z: z ? z : 0,
        };
        callback([pos_data]);
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(addPos, (err) => {
            console.error("api/getlocation.ts:getLocation", err);
        });
        navigator.geolocation.watchPosition(addPos, (err) => {
            console.error("api/getlocation.ts:getLocation", err);
        });
    }
}
