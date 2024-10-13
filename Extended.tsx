// EXTENDED VERSION CONTAINS LOGIC DEALING WITH MY BACKEND LOGIC CHANGE AS PER YOURS BUT THIS INCLUDES SETTING THE MARKER POSITION FROM THE FETCHED DATA AND ALSO PREFILLNIG THE FORMS FROM THE LATITUDE AND LONGITUDE POSITIONS.

import { useState, useEffect, useRef } from 'react';
import {
  APIProvider,
  ControlPosition,
  MapControl,
  AdvancedMarker,
  Map,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AddressData } from '../AddTeam';

type PostSiteProps = {
  addressData: AddressData // YOU CAN ADD YOUR ADDRESS DATA HERE MY ADDRESS DATA CONTAINS KEYS TO SEND TO THE BACKEND LIKE LATITUDE LONGITUDE AND MORE
  setAddressData: React.Dispatch<React.SetStateAction<AddressData>> 
}

const SiteMap: React.FC<PostSiteProps> = ({ addressData, setAddressData }) => {
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [markerPosition, setMarkerPosition] = useState({
    lat: addressData.latitude || 28.6110886,
    lng: addressData.longitude || 77.2345184
  });
  const API_KEY = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      setMarkerPosition(newPosition);
      updateAddressFromCoordinates(newPosition);
    }
  };
  // I AM SENDING THESE KEYS TO THE BACKEND ACCORDING TO MY NEEDS YOU CAN CHANGE ACCORDING TO YOURS.
  const updateAddressFromCoordinates = (position: { lat: number; lng: number }) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        const newAddressData = { ...addressData };

        result.address_components.forEach((component) => {
          const types = component.types;
          if (types.includes('street_number') || types.includes('route')) {
            newAddressData.post_site_address_line1 = (newAddressData.post_site_address_line1 + ' ' + component.long_name).trim();
          } else if (types.includes('locality')) {
            newAddressData.post_site_city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            newAddressData.post_site_state = component.long_name;
          } else if (types.includes('postal_code')) {
            newAddressData.post_site_pincode = component.long_name;
          } else if (types.includes('country')) {
            newAddressData.post_site_country = component.long_name;
          }
        });

        newAddressData.latitude = position.lat;
        newAddressData.longitude = position.lng;

        setAddressData(newAddressData);
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (selectedPlace && selectedPlace.geometry && selectedPlace.geometry.location) {
      const newPosition = {
        lat: selectedPlace.geometry.location.lat(),
        lng: selectedPlace.geometry.location.lng()
      };
      setMarkerPosition(newPosition);
      updateAddressFromCoordinates(newPosition);
    }
  }, [selectedPlace]);

  useEffect(() => {
    // THIS ALSO CONTAINS DATA FETCHING FROM THE BACKEND 
    if (addressData.latitude && addressData.longitude) {
      const newPosition = { lat: addressData.latitude, lng: addressData.longitude };
      setMarkerPosition(newPosition);
      if (mapRef.current) {
        mapRef.current.setCenter(newPosition);
        mapRef.current.setZoom(15);
      }
    }
  }, [addressData]);

  return (
    <div className="w-full mx-auto mt-12 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-normal text-[22px]">Post Site Address</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="post_site_address_line1">Address Line 1</Label>
              <Input
                type="text"
                id="post_site_address_line1"
                name="post_site_address_line1"
                value={addressData.post_site_address_line1}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post_site_address_line2">Address Line 2</Label>
              <Input
                type="text"
                id="post_site_address_line2"
                name="post_site_address_line2"
                value={addressData.post_site_address_line2}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="post_site_city">City</Label>
                <Input
                  type="text"
                  id="post_site_city"
                  name="post_site_city"
                  value={addressData.post_site_city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post_site_state">State</Label>
                <Input
                  type="text"
                  id="post_site_state"
                  name="post_site_state"
                  value={addressData.post_site_state}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="post_site_pincode">PIN Code</Label>
                <Input
                  type="text"
                  id="post_site_pincode"
                  name="post_site_pincode"
                  value={addressData.post_site_pincode}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post_site_country">Country</Label>
                <Input
                  type="text"
                  id="post_site_country"
                  name="post_site_country"
                  value={addressData.post_site_country}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <APIProvider
            apiKey={API_KEY}
            libraries={['places']}
            solutionChannel='GMP_devsite_samples_v3_rgmautocomplete'
          >
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center flex-grow">
                <MapPin className="w-6 h-6 text-primary mr-2 flex-shrink-0" />
                <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
              </div>
              <div className="text-sm text-muted-foreground ml-4 flex-shrink-0">
              </div>
            </div>
            <div className="h-[600px] relative">
              <Map
                mapId={'bf51a910020fa25a'}
                defaultZoom={15}
                center={markerPosition}
                gestureHandling={'greedy'}
                disableDefaultUI={false}
                style={{ width: '100%', height: '100%' }}
                ref={(map) => {
                  if (map) {
                    mapRef.current = map.state.map;
                  }
                }}
              >
                <AdvancedMarker
                  ref={markerRef}
                  position={markerPosition}
                  draggable={true}
                  onDragEnd={handleMarkerDragEnd}
                />
                <MapControl position={ControlPosition.TOP_LEFT}>
                  <div className="m-2">
                    {/* <Button
                      variant="secondary"
                      onClick={() => {
                        if (marker) {
                          marker.map = null;
                        }
                      }}
                    >
                      Clear Marker
                    </Button> */}
                  </div>
                </MapControl>
              </Map>
              <MapHandler place={selectedPlace} marker={marker} setMarkerPosition={setMarkerPosition} />
            </div>
          </APIProvider>
        </CardContent>
      </Card>
    </div>
  );
};

interface MapHandlerProps {
  place: google.maps.places.PlaceResult | null;
  marker: google.maps.marker.AdvancedMarkerElement | null;
  setMarkerPosition: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>;
}

const MapHandler = ({ place, marker, setMarkerPosition }: MapHandlerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !place || !marker) return;

    if (place.geometry?.viewport) {
      map.fitBounds(place.geometry?.viewport);
    } else if (place.geometry?.location) {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
    const newPosition = {
      lat: place.geometry?.location?.lat() || 0,
      lng: place.geometry?.location?.lng() || 0
    };
    setMarkerPosition(newPosition);
    marker.position = newPosition;
    marker.map = map;
  }, [map, place, marker, setMarkerPosition]);

  return null;
};

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
}

const PlaceAutocomplete = ({ onPlaceSelect }: PlaceAutocompleteProps) => {
  const [placeAutocomplete, setPlaceAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'name', 'formatted_address']
    };

    const autocomplete = new places.Autocomplete(inputRef.current, options);
    setPlaceAutocomplete(autocomplete);

    return () => {
      if (autocomplete) {
        autocomplete.unbindAll();
      }
    };
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    const listener = placeAutocomplete.addListener('place_changed', () => {
      const place = placeAutocomplete.getPlace();
      onPlaceSelect(place);
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [placeAutocomplete, onPlaceSelect]);

  return (
    <div className="relative flex-grow">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search for a place"
        className="w-full"
      />
    </div>
  );
};

export default SiteMap;
