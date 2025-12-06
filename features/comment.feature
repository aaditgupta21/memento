Feature: Commenting on a post
    As a user,
    I want to comment on a post on my feed,
    so that I can have greater connection with the posts

    Background:
        Given I am logged in as "testexample@example.com"
    
    Scenario: Comment on a post
        When I navigate to the feed page
        And I type in the "Add a comment..." Field
        And I submit the comment
        Then the comment should appear under the post