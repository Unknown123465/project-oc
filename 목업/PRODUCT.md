# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Original-character (OC) creators who want a clean, unified profile card for a character to share on SNS and fandom/creative communities (e.g. Twitter/X, Korean SNS, community boards). Their job: turn scattered character info (name, slogan, trivia, art) into a polished, shareable profile without hand-designing one themselves.

## Product Purpose

프로젝트 OC (Project OC) is a template-based character-profile maker. Creators fill in structured character info and imagery and get a clean, unified profile card out, instead of assembling one by hand in a general design tool. Success is a creator producing a shareable profile quickly, and a reader being able to view and react to it with minimal friction (no account required to engage).

## Positioning

The mechanism a generic form builder or design tool (Notion template, Canva) can't truthfully copy: opinionated, pre-built profile templates purpose-built for OC conventions (name, slogan, TMI, species, birth date, custom fields), paired with granular sharing controls (public / link-only / private) and guest engagement — viewers can like and comment without creating an account.

## Operating Context

Creators sign up (username/password, or Naver/Google OAuth), build a character through a structured creation form, publish it, and manage multiple characters from a collection view. Profiles render in several layout variants (horizontal / vertical / square card). A template gallery lets people browse existing profiles/templates in logged-out, empty, and populated states. Non-members can view public profiles and like/comment without an account.

## Capabilities and Constraints

- Auth: username/password plus Naver and Google social login.
- Character creation fields seen in the mockups: name, slogan (short tagline), TMI (freeform trivia, newline-separated entries), birth date (year optional, month, day), species/race (preset options plus custom text), arbitrary user-added custom elements, profile photo, background image.
- Visibility/sharing: public, link-only, private.
- Engagement: likes and comments are open to guests — no account required.
- Account settings surface: email, username, password, linked social accounts, a "재생 설정" (playback/motion) preference of unconfirmed exact scope, activity history, and account deletion.
- No paid tier. The account-settings mockup includes a "구독 플랜" (subscription plan) section, but this is confirmed placeholder/aspirational content, not a committed feature — the product is free.
- Primary language is Korean; all observed UI copy is Korean (`lang="ko"`).

## Brand Commitments

Name: 프로젝트 OC (Project OC). Personal, solo-maintained open-source project (footer credits "Unknown123465", links to a GitHub profile, and has an open-source license page). Brand color is gold/amber `#FFC90E` on near-black `#0d0c22` with warm neutral backgrounds; typeface is Pretendard (Pretendard Variable / PretendardStdVariable). The live Next.js app already codifies this palette as CSS custom properties, and its header/footer components already exist.

## Evidence on Hand

- Wireframes/mockups in this directory (`목업/`) covering: main landing page, login, signup, site 404, character 404, account settings, my-characters collection, character creation, template browsing (logged-out / empty / has-templates states), and a character profile viewer (4 layout variants).
- Additional `.ai` wireframe source files at `../와이어프레임/`.
- A live, partial Next.js implementation at `../project-oc/` (Next.js 16, React 19, TypeScript) with header, footer, and global CSS tokens already built; no page content beyond the app shell yet.
- No real testimonials, customer logos, or usage data exist. Future work must not fabricate them.

## Product Principles

1. Structure over freeform — profiles are built from opinionated templates/fields, not a blank canvas, so any new profile stays clean and unified.
2. Sharing meets people where they are — granular visibility and guest-friendly engagement (no signup to like/comment) come before anything else social.
3. Korean-first, SNS/community-native — copy, conventions (TMI, slogan), and OAuth choices (Naver, Google) target the Korean creator community specifically.
4. Free and solo-maintained — scope stays achievable for a single open-source maintainer; no monetization commitments.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established yet.
