Feature: Liking a post
    As a user,
    I want to like and comment on a post on my feed,
    so that I can have greater connection with the posts

    Background:
        Given I am logged in as "testexample@example.com"
    
    Scenario: Like a post
        When I navigate to the feed page
        And I click the like button on the first post
        Then the like button should now say "unlike"
    
    Scenario: Unlike a post
        When I navigate to the feed page
        And I click the unlike button on the first post
        Then the like button should now say "like"