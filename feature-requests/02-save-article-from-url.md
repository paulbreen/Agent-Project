# Feature: Save Article from URL

**User Story:**

As a user, I want to be able to save an article from a URL so that I can read it later.

**Acceptance Criteria:**

*   A logged-in user can submit a URL through a form on the application's main page.
*   The application should validate the URL.
*   The application should fetch the content of the article from the provided URL.
*   The application should extract the main content of the article, removing ads, navigation, and other non-essential elements.
*   The extracted content should be stored in the database and associated with the user.
*   The user should be redirected to their list of saved articles after saving a new one.

**Technical Notes:**

*   Consider using a library like `mercury-parser` or `node-readability` to extract the main content of the article.
*   The application will need a database to store the saved articles.
