import {useEffect, FC, useState} from 'react';

const Marker: FC<{options: google.maps.MarkerOptions, infoWindow: boolean, infoWindowContent: string}> = ({options, infoWindow, infoWindowContent}) => {
  const [marker, setMarker] = useState<google.maps.Marker>();
  const [infoWindowListener, setInfoWindowListener] = useState<google.maps.MapsEventListener>();

  useEffect(() => {
    if (!marker) {
      setMarker(new google.maps.Marker({
        ...options,
      }));
    }

    // remove marker from map on unmount
    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [marker]);

  useEffect(() => {
    if (marker) {
      marker.setOptions(options);

      setInfoWindowListener(google.maps.event.addListener(marker, 'click', ()=>{
        console.log('Clicked Marker:', infoWindowContent)
        infoWindow.setContent(infoWindowContent)
        infoWindow.open({
          map: options.map,
          anchor: marker,
          shouldFocus:true
        } as google.maps.InfoWindowOpenOptions)
      }))
    }

    return () =>{
      google.maps.event.removeListener(infoWindowListener);
    }
  }, [marker, options]);

  return null;
};

export default Marker;