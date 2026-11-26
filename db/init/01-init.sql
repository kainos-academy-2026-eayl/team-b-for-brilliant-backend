--
-- PostgreSQL database dump
--

\restrict ZijdB8WVTjmCc618eE9lgNUeRAb7P19MYlcflX8G019OzNOmrbE5DcTBNdqsVAN

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: DiscountType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DiscountType" AS ENUM (
    'PERCENTAGE',
    'AMOUNT_OFF'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Basket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Basket" (
    "basketID" text NOT NULL,
    "userID" text NOT NULL,
    "productID" text NOT NULL,
    quantity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Category" (
    "categoryID" text NOT NULL,
    name text NOT NULL,
    description text,
    "departmentID" text NOT NULL
);


--
-- Name: Department; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Department" (
    "departmentID" text NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: Discounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Discounts" (
    "discountID" text NOT NULL,
    code text NOT NULL,
    type public."DiscountType" NOT NULL,
    value numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL
);


--
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Order" (
    "orderID" text NOT NULL,
    "userID" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "discountID" text,
    "deliveryFirstname" text,
    "deliverySurname" text,
    "deliveryAddressLine1" text,
    "deliveryAddressLine2" text,
    "deliveryPostcode" text,
    "deliveryCharge" numeric(10,2),
    "discountAmount" numeric(10,2),
    "paymentStatus" text,
    "cardLast4" text
);


--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderItem" (
    "orderItemID" text NOT NULL,
    "orderID" text NOT NULL,
    "productID" text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    "productID" text NOT NULL,
    name text NOT NULL,
    description text,
    quantity integer NOT NULL,
    draft boolean DEFAULT true NOT NULL,
    visible boolean DEFAULT false NOT NULL,
    weight double precision NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "salesNo" integer DEFAULT 0 NOT NULL
);


--
-- Name: ProductCategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductCategories" (
    "productID" text NOT NULL,
    "categoryID" text NOT NULL
);


--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductImage" (
    "imageID" text NOT NULL,
    "productID" text NOT NULL,
    "imageUrl" text NOT NULL,
    "imageOrder" integer NOT NULL
);


--
-- Name: ProductPrices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductPrices" (
    "priceID" text NOT NULL,
    "productID" text NOT NULL,
    price numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Role" (
    "roleID" text NOT NULL,
    name text NOT NULL,
    description text,
    "accessLevel" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SecurityQuestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SecurityQuestion" (
    "questionID" text NOT NULL,
    question text NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    "userID" text NOT NULL,
    email text,
    firstname text,
    surname text,
    "addressLine1" text,
    "addressLine2" text,
    postcode text,
    "passwordHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "roleID" text,
    "securityQuestionID" text,
    "securityAnswer" text
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Category" ("categoryID", name, description, "departmentID") FROM stdin;
category-1	category 1	this is a test	department-1
category-2	category 2	This is another test	department-2
category-3	category 3	Yet another test	department-1
category-4	category 4	Test numero 4	department-2
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Department" ("departmentID", name, description) FROM stdin;
department-1	Test Department	This is a test
department-2	2nd Test Department	This is another test
\.


--
-- Data for Name: Discounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Discounts" ("discountID", code, type, value, "createdAt", "expiryDate") FROM stdin;
1	12345	PERCENTAGE	12.00	2026-11-03 11:06:51.489	2031-01-09 00:00:00
1c2332eb-6132-4468-b8a1-b4c39984077d	HALLOWEEN	PERCENTAGE	5.00	2026-11-10 11:35:29.945	2027-10-31 00:00:00
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" ("productID", name, description, quantity, draft, visible, weight, "deletedAt", "salesNo") FROM stdin;
8692db1b-4675-48c1-8874-3c870a99d3b3	Test Product	Test	12	f	t	3	\N	0
product-3	Volumizing Mascara	Volumizing mascara with conditioning formula, dramatic lashes in one coat	22	f	t	0.08	\N	156
product-5	Liquid Lipstick Set	Set of 12 liquid lipsticks in various shades, waterproof long-lasting formula	35	f	t	0.25	\N	324
product-6	Korean Sheet Mask Pack	10-pack of hydrating sheet masks with essence, brightening formula	60	f	t	0.5	\N	501
product-7	Luxury Makeup Brush Set	24-piece synthetic makeup brush set, includes face and eye brushes	12	f	t	0.4	\N	89
product-8	Hydrating Lip Balm	Nourishing lip balm with vitamin E, prevents chapping	55	f	t	0.05	\N	743
product-9	Bone Smashing Hammer	Professional-grade titanium bone smashing hammer for looksmaxxing, ergonomic design	5	f	t	2.2	\N	12
product-10	Limited Edition Eyeshadow Palette (Test)	This palette is out of stock and discontinued	0	t	f	0.35	\N	0
product-1	Hyaluronic Acid Serum	Deep hydrating serum with hyaluronic acid, plumps skin for a glowing complexion	20	f	t	0.15	\N	287
e8625c91-e2bd-4a27-a656-0982cf89ac07	Test	Test	500	t	f	23	\N	0
94ad141a-308e-410e-9e4f-d00e24046010	sd	sd	23	t	f	23	\N	0
4a873e7a-82f2-4151-a202-1987908f479f	Super Test Product (Test)	Another Test Description	12	f	t	8	\N	0
502ec49a-d5cb-4e61-ba95-fe43832e8c9e	New Test to See if actually Works	Please Work	23	t	f	23	\N	0
product-4	Retinol Night Cream	Anti-aging retinol night cream, reduces fine lines and wrinkles	18	f	t	0.3	\N	198
product-2	Full Coverage Foundation	Professional-grade full coverage foundation, matte finish, 24-hour wear	45	f	t	0.2	\N	412
\.


--
-- Data for Name: ProductCategories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductCategories" ("productID", "categoryID") FROM stdin;
product-1	category-1
product-1	category-2
502ec49a-d5cb-4e61-ba95-fe43832e8c9e	category-1
502ec49a-d5cb-4e61-ba95-fe43832e8c9e	category-2
502ec49a-d5cb-4e61-ba95-fe43832e8c9e	category-3
502ec49a-d5cb-4e61-ba95-fe43832e8c9e	category-4
product-2	category-4
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductImage" ("imageID", "productID", "imageUrl", "imageOrder") FROM stdin;
33e20f42-7727-49ac-9df6-6d73d2f3a6e5	4a873e7a-82f2-4151-a202-1987908f479f	/images/product-229d0639-b8fe-46b5-bd56-b8adce992260.webp	0
41c86e43-c7f1-4eb1-9809-9d9d936e5e77	4a873e7a-82f2-4151-a202-1987908f479f	/images/product-9c29a008-20d1-434f-80e6-124efeae63a9.webp	1
image-1	product-1	/images/product-1.svg	0
16f84c14-c788-463d-bbee-7d7e68f18989	502ec49a-d5cb-4e61-ba95-fe43832e8c9e	/images/product-100fef77-7398-48b4-acd2-6fc3839726b9.webp	0
b107ee6f-cebf-41b9-8b25-9b9a5bdc4996	502ec49a-d5cb-4e61-ba95-fe43832e8c9e	/images/product-887da3a7-9a35-4873-82e5-b53e6ae125cb.webp	1
49901615-869e-4d59-8a9e-b6e13916910b	502ec49a-d5cb-4e61-ba95-fe43832e8c9e	/images/product-fe7b9555-a9c0-45f6-a17b-b3d8125218ae.webp	2
image-4	product-4	/images/product-4.svg	0
image-2	product-2	/images/product-2.svg	0
image-3	product-3	/images/product-3.svg	0
a6b19628-d2c5-4440-ad90-69edcbd8dd06	product-2	/images/upload-07f959e4-041d-4a2c-a4ed-cf3756267bf7.jpg	1
image-5	product-5	/images/product-5.svg	0
image-6	product-6	/images/product-6.svg	0
image-7	product-7	/images/product-7.svg	0
image-8	product-8	/images/product-8.svg	0
image-9	product-9	/images/product-9.svg	0
f67f3b10-5da7-45ff-be60-740e9f8f4296	8692db1b-4675-48c1-8874-3c870a99d3b3	/images/product-fbe5b162-1238-47cb-929e-c0953da3b133.webp	0
de865049-1e65-4b95-b088-8ba8621896a8	product-2	/images/upload-18a308cb-2dc6-46cc-8f8a-6307b1d3e7a8.jpg	2
218647c2-bba0-4658-a9ab-bcc34c5e1b90	product-10	/images/upload-018fa9fb-1c7b-45d2-9a73-94894fcf93be.png	0
image-10	product-10	/images/product-10.svg	1
d9e8a69e-c39e-48e4-ad5f-f3c1a2205444	e8625c91-e2bd-4a27-a656-0982cf89ac07	/images/product-35fad2c9-3b5d-4190-99e6-69d5d446a3c6.webp	0
87ed23bb-765d-46fa-ae46-f2da7b3aaff4	e8625c91-e2bd-4a27-a656-0982cf89ac07	/images/product-9e0f9adf-bdfb-4642-a4db-8701e8d5fad0.webp	1
ac1f3d1d-5d52-4fe5-8fd5-4dde9db4208f	e8625c91-e2bd-4a27-a656-0982cf89ac07	/images/product-2d5548a3-ade9-42d4-b2e8-726c3fbc5507.webp	2
203e9d22-9c2b-4662-ad9c-d9ee0e691092	94ad141a-308e-410e-9e4f-d00e24046010	/images/product-a35cc99b-9064-4e18-b552-4271ba47b3f1.webp	0
\.


--
-- Data for Name: ProductPrices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductPrices" ("priceID", "productID", price, "createdAt") FROM stdin;
5ac4aff8-47f5-4a02-a7bf-20130dedabfc	4a873e7a-82f2-4151-a202-1987908f479f	62.99	2026-11-05 09:16:13.275
80d1b482-dab7-40c7-b6b1-6041d14d204c	e8625c91-e2bd-4a27-a656-0982cf89ac07	12.23	2026-11-05 11:11:32.319
8de63d5c-ffe4-48ab-9376-c34ff6cbc6a4	94ad141a-308e-410e-9e4f-d00e24046010	23.00	2026-11-05 11:12:01.386
product-1-price-1	product-1	34.99	2026-10-01 00:00:00
product-1-price-2	product-1	39.99	2026-10-02 00:00:00
product-1-price-3	product-1	37.99	2026-10-03 00:00:00
product-2-price-1	product-2	44.99	2026-10-01 00:00:00
product-2-price-2	product-2	49.99	2026-10-02 00:00:00
product-2-price-3	product-2	47.99	2026-10-03 00:00:00
product-3-price-1	product-3	24.99	2026-10-01 00:00:00
product-3-price-2	product-3	29.99	2026-10-02 00:00:00
product-3-price-3	product-3	27.99	2026-10-03 00:00:00
product-4-price-1	product-4	59.99	2026-10-01 00:00:00
product-4-price-2	product-4	69.99	2026-10-02 00:00:00
product-4-price-3	product-4	64.99	2026-10-03 00:00:00
product-5-price-1	product-5	29.99	2026-10-01 00:00:00
product-5-price-2	product-5	34.99	2026-10-02 00:00:00
product-5-price-3	product-5	32.99	2026-10-03 00:00:00
product-6-price-1	product-6	19.99	2026-10-01 00:00:00
product-6-price-2	product-6	24.99	2026-10-02 00:00:00
product-6-price-3	product-6	22.99	2026-10-03 00:00:00
product-7-price-1	product-7	49.99	2026-10-01 00:00:00
product-7-price-2	product-7	59.99	2026-10-02 00:00:00
product-7-price-3	product-7	54.99	2026-10-03 00:00:00
product-8-price-1	product-8	12.99	2026-10-01 00:00:00
product-8-price-2	product-8	14.99	2026-10-02 00:00:00
product-8-price-3	product-8	13.99	2026-10-03 00:00:00
product-9-price-1	product-9	299.99	2026-10-01 00:00:00
product-9-price-2	product-9	349.99	2026-10-02 00:00:00
product-9-price-3	product-9	324.99	2026-10-03 00:00:00
product-10-price-1	product-10	79.99	2026-10-01 00:00:00
product-10-price-2	product-10	89.99	2026-10-02 00:00:00
product-10-price-3	product-10	84.99	2026-10-03 00:00:00
aa223a0d-5776-4faf-a20f-d0ee6e67a230	product-1	99.99	2026-11-04 11:11:03.779
a85fbfa7-dc78-4a98-8ab5-7db739ebb35f	8692db1b-4675-48c1-8874-3c870a99d3b3	12.99	2026-11-04 15:53:05.747
273b3172-6c99-42ca-ae5e-b30cf7ab8a1b	502ec49a-d5cb-4e61-ba95-fe43832e8c9e	67.67	2026-11-05 15:26:20.489
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Role" ("roleID", name, description, "accessLevel", "createdAt") FROM stdin;
1	Customer	Default role for customers	0	2026-11-03 09:16:30.123
2	Admin	Default role for admins	1	2026-11-03 09:16:30.135
\.


--
-- Data for Name: SecurityQuestion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SecurityQuestion" ("questionID", question) FROM stdin;
1	What is your mum's name?
2	What is your pet's name?
3	What is the name of your favourite teacher?
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
342e2493-86ba-40b9-b117-67fe35e61873	40a35acebd836292953d5fc8d8ec361ebb06890699e9507da63b85dc33726b5d	2026-11-05 15:39:26.039547+00	20261105120000_allow_deleted_user_accounts	\N	\N	2026-11-05 15:39:26.035202+00	1
ffa8ed86-c784-4e42-993f-0ed9d0bfa4f0	dc40a028a28a86dfb9b43ef667b315cb44ad882c0aa527a9aec38c37106fd169	2026-10-21 08:56:07.824308+00	20261021085607_create_products_and_product_images	\N	\N	2026-10-21 08:56:07.817718+00	1
f0bf4108-5e0e-4d05-9b6b-e319c3a2922d	85716f3daa7e1d4b41ea72d34fd9230dfce7bb22f2763520f2e569157ef4dd54	2026-10-21 09:58:19.9941+00	20261021095819_add_product_prices	\N	\N	2026-10-21 09:58:19.988851+00	1
a19aa896-3211-47c7-94ef-90e5749e4eda	df0e53a5754d3a6cae22d16dc073bb2c0360be83b3f18ced6a92581c2ad2b5df	2026-10-21 13:58:18.826595+00	20261021135818_add_product_image_main_image	\N	\N	2026-10-21 13:58:18.823666+00	1
bd14cd45-c12d-4244-93b8-c101f8cb90c0	d4436860b50047a43a268fe8f49798422a6af2c0a2acf98e0c4e2b5708a08589	2026-10-21 14:06:48.838801+00	20261021140700_replace_main_image_with_image_order	\N	\N	2026-10-21 14:06:48.834214+00	1
26df6347-cd1b-45f4-988d-38c5a31bcf20	fb6568b883f916597cda17bcd2b8627b271906256ea77239f707631187b1dc8d	2026-10-22 12:41:56.954537+00	20261022124156_add_categories_and_departments	\N	\N	2026-10-22 12:41:56.939331+00	1
542b4e81-5af1-428a-b0f7-4ca5d54e8f9d	6c31355a29dbbf9723705f0080326caa17768a3a594f5ca89ab3c4b25be28bbe	2026-10-27 14:14:44.183172+00	20261023085437_add_registration	\N	\N	2026-10-27 14:14:44.169518+00	1
8beac10c-cf03-413b-bd32-98d65beb4455	5b8bc1661487fbfad1e6d76cf3d5ba0c9e60a8448d48ce08ce5d7af74e7b4c5d	2026-10-27 14:14:44.196256+00	20261023095829_add_salesno_to_product	\N	\N	2026-10-27 14:14:44.183969+00	1
ed2398b9-cf06-4945-9e4a-0747529b8d84	42eaad10fbd69eb7448d05596530baa82eb9acd3436ea61d3cc111d21e816622	2026-10-27 14:27:53.25859+00	20261027142300_unify_users_and_baskets	\N	\N	2026-10-27 14:27:53.250632+00	1
9cb12e48-5d4b-4bbc-9bbd-b84675f34c26	8fdfa386ea274ffd6c3a33a693113e37b469d144900262bdf3798b7fe86c9342	2026-10-29 14:04:25.063188+00	20261029134028_add_discounts	\N	\N	2026-10-29 14:04:25.056639+00	1
09fc7772-dca7-4168-85a3-b9a68c4fcb0d	e640a599b9e2a69172fe84b269229d5c5a5fbb11c398e2acfd549148931cb0cb	2026-10-30 11:14:33.580045+00	20261030120000_add_revoked_tokens	\N	\N	2026-10-30 11:14:33.573998+00	1
ccb57cdc-9561-4002-be67-528535880995	7c6d4e6678695c09689a32dd776ecebf4b3b767463a4210c822d423d424ecc2f	2026-10-30 13:15:10.229717+00	20261030131510_discounts	\N	\N	2026-10-30 13:15:10.223499+00	1
6d446e11-f7d1-44ac-bde3-0a926b301b41	d5dae4622b23ba358da7923b8f33791c2ade9e65131ba158ec9d9d158c8c58bc	2026-11-05 11:06:01.644406+00	20261104133600_add_order_checkout_details	\N	\N	2026-11-05 11:06:01.638104+00	1
\.


--
-- Name: Basket Basket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Basket"
    ADD CONSTRAINT "Basket_pkey" PRIMARY KEY ("basketID");


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryID");


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY ("departmentID");


--
-- Name: Discounts Discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Discounts"
    ADD CONSTRAINT "Discounts_pkey" PRIMARY KEY ("discountID");


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("orderItemID");


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("orderID");


--
-- Name: ProductCategories ProductCategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductCategories"
    ADD CONSTRAINT "ProductCategories_pkey" PRIMARY KEY ("productID", "categoryID");


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("imageID");


--
-- Name: ProductPrices ProductPrices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductPrices"
    ADD CONSTRAINT "ProductPrices_pkey" PRIMARY KEY ("priceID");


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("productID");


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("roleID");


--
-- Name: SecurityQuestion SecurityQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SecurityQuestion"
    ADD CONSTRAINT "SecurityQuestion_pkey" PRIMARY KEY ("questionID");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("userID");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Basket_userID_productID_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Basket_userID_productID_key" ON public."Basket" USING btree ("userID", "productID");


--
-- Name: Discounts_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Discounts_code_key" ON public."Discounts" USING btree (code);


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Basket Basket_productID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Basket"
    ADD CONSTRAINT "Basket_productID_fkey" FOREIGN KEY ("productID") REFERENCES public."Product"("productID") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Basket Basket_userID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Basket"
    ADD CONSTRAINT "Basket_userID_fkey" FOREIGN KEY ("userID") REFERENCES public."User"("userID") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Category Category_departmentID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_departmentID_fkey" FOREIGN KEY ("departmentID") REFERENCES public."Department"("departmentID") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES public."Order"("orderID") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productID_fkey" FOREIGN KEY ("productID") REFERENCES public."Product"("productID") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_discountID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_discountID_fkey" FOREIGN KEY ("discountID") REFERENCES public."Discounts"("discountID") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_userID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userID_fkey" FOREIGN KEY ("userID") REFERENCES public."User"("userID") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductCategories ProductCategories_categoryID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductCategories"
    ADD CONSTRAINT "ProductCategories_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES public."Category"("categoryID") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductCategories ProductCategories_productID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductCategories"
    ADD CONSTRAINT "ProductCategories_productID_fkey" FOREIGN KEY ("productID") REFERENCES public."Product"("productID") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductImage ProductImage_productID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productID_fkey" FOREIGN KEY ("productID") REFERENCES public."Product"("productID") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductPrices ProductPrices_productID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductPrices"
    ADD CONSTRAINT "ProductPrices_productID_fkey" FOREIGN KEY ("productID") REFERENCES public."Product"("productID") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_roleID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES public."Role"("roleID") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_securityQuestionID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_securityQuestionID_fkey" FOREIGN KEY ("securityQuestionID") REFERENCES public."SecurityQuestion"("questionID") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict ZijdB8WVTjmCc618eE9lgNUeRAb7P19MYlcflX8G019OzNOmrbE5DcTBNdqsVAN

