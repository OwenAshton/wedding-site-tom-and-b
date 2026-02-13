import {Children, useRef, useEffect, useState, FC, isValidElement, cloneElement} from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

const mapStyles = {
  height: "100%",
  width: "100%",
  margin: "1.5rem auto",
  "maxHeight": "40rem",
  "maxWidth": "40rem",
  minHeight: "30rem",
  minWidth: "20rem",
};

interface MapProps extends google.maps.MapOptions {
  style: { [key: string]: string };
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (map: google.maps.Map) => void;
}

const mapOptions = {
  center: { lat: 53.4443, lng: -2.1946 },
  zoom: 15,
} as google.maps.MapOptions; 

const MapComponent: FC<MapProps> =  ({
  onClick,
  onIdle,
  children,
  style,
  ...options
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow>();

	useEffect(() => {
		if(!infoWindow){
			setInfoWindow(new google.maps.InfoWindow());
		}

		// close info window on unmount
		return () => {
			if(infoWindow){
				infoWindow.close();
			}
		}
	}, [infoWindow]);

useEffect(() => {
  if (ref.current && !map) {
    setMap(new window.google.maps.Map(ref.current, mapOptions));

    google.maps.event.addListener(window, "resize", () => {
      const center = map.getCenter();
      google.maps.event.trigger(map, "resize");
      map.setCenter(center);
    });
  }
}, [ref, map, onresize]);

  return ( 
  <>
    <div ref={ref} id="map" style={mapStyles} />
    {Children.map(children, (child) => {
      if (isValidElement(child)) {
        // set the map prop on the child component
        return cloneElement(child, { options:{map, ...child.props.options}, infoWindow: infoWindow, infoWindowContent:child.props.infoWindowContent }, );
      }
    })}
  </>
  );
}

export default MapComponent;