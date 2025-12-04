Feature: Upload Feature Workflow
    As a user,
    I want to upload photos from my device to create a post,
    so that I can share my memories

    Background:
        Given that I am logged in as "testexample@example.com
    
    Scenario: Complete the full 4-step upload wizard
        When I navigate to the upload page
        And I upload an image file
        And I wait for the upload preview to appear
        And I click "Next: Caption & Location"
        And I fill in the caption with "Test post from Cucumber"
        And I fill in the location with "San Francisco"
        And I select the first location suggestion
        And I click "Next: Categories"
        And I select the first category
        And I click "Review & Submit"
        And I scroll to the bottom of the page
        And I click "Create Post"
        Then I should be redirected to the feed page
        And the post with caption "Test post from Cucumber" should be visible