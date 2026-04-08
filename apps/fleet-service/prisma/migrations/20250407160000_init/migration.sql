CREATE TABLE "Transport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Transport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Courier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL,
    "transport_id" TEXT,

    CONSTRAINT "Courier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "courier_locations" (
    "id" TEXT NOT NULL,
    "courier_id" TEXT NOT NULL,
    "order_id" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courier_locations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Courier" ADD CONSTRAINT "Courier_transport_id_fkey" FOREIGN KEY ("transport_id") REFERENCES "Transport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "courier_locations" ADD CONSTRAINT "courier_locations_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "Courier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "courier_locations_courier_id_idx" ON "courier_locations"("courier_id");

CREATE INDEX "courier_locations_order_id_idx" ON "courier_locations"("order_id");
