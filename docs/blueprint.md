# **App Name**: Yandex Map Reviews

## Core Features:

- Yandex Map Integration: Integrate Yandex Maps API to display an interactive map.
- User Authentication: Implement user registration and authentication system with 'regular user' and 'admin' roles. Regular users can create/read their own reviews, while admins can edit/delete all reviews.
- Map Marker Creation: Allow logged-in users to add markers to the map with review text. Prevent creating a new marker in the exact same location, to avoid overlap.
- Review Display on Marker Click: When a user clicks on a marker, display existing reviews and an option to add a new review for that location.
- Review Menu with Search/Sort: Create a menu to display all reviews with search and sort functionalities, available to all users. Sorting would include options like 'most recent', 'highest rated', or similar. The sorting criteria will be suggested by an LLM tool depending on how active each review is.
- Admin Review Management: Enable admin users to edit and delete both markers and reviews through an admin panel.

## Style Guidelines:

- Primary color: A vibrant blue (#29ABE2) to reflect the mapping aspect of the app.
- Background color: A light gray (#F5F5F5) to provide a clean and neutral base.
- Accent color: A bright orange (#FF9933) for interactive elements like buttons and markers.
- Body font: 'PT Sans', a versatile humanist sans-serif for readability and a modern feel.
- Headline font: 'Space Grotesk' for map elements.
- Use clear and recognizable icons for map markers and menu options.
- Implement a responsive layout that adapts to different screen sizes, ensuring usability on both desktop and mobile devices.