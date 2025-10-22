'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Client, AddressType } from "@googlemaps/google-maps-services-js";

const GetLocationFromCoordsInputSchema = z.object({
  lat: z.number().describe('The latitude of the location.'),
  lng: z.number().describe('The longitude of the location.'),
});

type GetLocationFromCoordsInput = z.infer<typeof GetLocationFromCoordsInputSchema>;

const GetLocationFromCoordsOutputSchema = z.object({
  name: z.string().describe('The formatted address of the location.'),
});

type GetLocationFromCoordsOutput = z.infer<typeof GetLocationFromCoordsOutputSchema>;

const getLocationFromCoordsFlow = ai.defineFlow(
  {
    name: 'getLocationFromCoordsFlow',
    inputSchema: GetLocationFromCoordsInputSchema,
    outputSchema: GetLocationFromCoordsOutputSchema,
  },
  async (input) => {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
        throw new Error("GOOGLE_MAPS_API_KEY environment variable not set.");
    }
    const client = new Client({});
    try {
      const response = await client.reverseGeocode({
        params: {
          latlng: { lat: input.lat, lng: input.lng },
          key: process.env.GOOGLE_MAPS_API_KEY,
          result_type: [AddressType.political, AddressType.locality, AddressType.sublocality, AddressType.neighborhood, AddressType.street_address, AddressType.premise],
          language: 'ru'
        },
      });

      if (response.data.results.length > 0) {
        // Return the first, most specific result
        return { name: response.data.results[0].formatted_address };
      } else {
        // Fallback if no results
        return { name: "Неизвестное местоположение" };
      }
    } catch (error) {
        console.error('Error fetching location from Google Maps:', error);
        throw new Error('Could not retrieve location information.');
    }
  }
);

export async function getLocationFromCoords(input: GetLocationFromCoordsInput): Promise<GetLocationFromCoordsOutput> {
  return getLocationFromCoordsFlow(input);
}
