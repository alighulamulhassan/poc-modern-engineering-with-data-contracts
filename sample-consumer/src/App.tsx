import React from "react";
import { Car } from "@infinityworks/api-types";

const exampleCar: Car = {
  id: "car-123",
  make: "Toyota",
  model: "Camry",
  year: 2023,
  color: "Silver",
  price: 25000,
  features: ["Bluetooth", "Navigation"],
  specifications: {
    engine: "2.5L 4-cylinder",
    transmission: "Automatic",
    fuelType: "Gasoline",
    mileage: 30.5,
  },
};

export default function App() {
  return (
    <div>
      <h1>Car Example</h1>
      <pre>{JSON.stringify(exampleCar, null, 2)}</pre>
    </div>
  );
}
