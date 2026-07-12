# TransitOps
## Smart Transport Operations Platform

---

> Digitize the entire lifecycle of a transport fleet — vehicles, drivers, dispatch, maintenance, fuel, and expenses — in one rule-driven system. No spreadsheets. No manual logbooks. No missed license renewals.

---

> [!IMPORTANT]
> **Public Testing Credentials**
>
> **Live Deployed Site**: [TransitOps Web App](https://transit-iqk8cmme4-contactharrsh-8109s-projects.vercel.app/)
>
> To test the live deployed version, you can log in using any of the following pre-seeded role accounts:
> * **Fleet Manager**: `manager@transitops.in` (Password: `password123`)
> * **Dispatcher**: `dispatcher@transitops.in` (Password: `password123`)
> * **Safety Officer**: `safety@transitops.in` (Password: `password123`)
> * **Financial Analyst**: `analyst@transitops.in` (Password: `password123`)

---

## The Problem

Most logistics and fleet operators — from regional trucking companies to last-mile delivery fleets — still run their day-to-day operations on spreadsheets, WhatsApp groups, and paper logbooks.

That means:

- **Double-booked vehicles** because two dispatchers assigned the same truck at the same time.
- **Drivers sent out with expired licenses** because nobody cross-checked the expiry date before dispatch.
- **Vehicles that should be in the workshop still showing up as "available"** because the maintenance log lives in a separate Excel file.
- **Overloaded vehicles** because cargo weight was never checked against the vehicle's rated capacity.
- **No real picture of cost** — fuel bills, toll receipts, and repair invoices sit in three different places, so nobody actually knows the operational cost or ROI of a given vehicle.

**TransitOps** replaces all of this with a single, rule-enforced system: register a vehicle and driver once, and the platform handles every status transition, every eligibility check, and every cost roll-up automatically.

---

## Target Users

| Role | What they do on TransitOps |
|---|---|
| **Fleet Manager** | Oversees the fleet lifecycle end-to-end — vehicle onboarding, retirement, maintenance scheduling, and overall operational efficiency. |
| **Dispatcher** | Creates trips, assigns available vehicles and drivers, and tracks active deliveries through to completion. |
| **Safety Officer** | Monitors license validity, driver compliance, and safety scores — the last line of defense before an unsafe driver or vehicle gets dispatched. |
| **Financial Analyst** | Reviews fuel spend, maintenance costs, and per-vehicle profitability to guide fleet investment decisions. |

All four roles work off the **same dataset**, viewed through **role-based access control (RBAC)** — a Financial Analyst sees costs and ROI, a Safety Officer sees license/compliance flags, and so on.

---

## Operational Scenarios

### Scenario 1 — The Overloaded Truck That Never Left the Yard

A dispatcher tries to book Van-05 (max capacity 500 kg) for a delivery with 650 kg of cargo.

**Without TransitOps:** The load sheet is a spreadsheet cell. Nobody notices the mismatch until the vehicle is already overloaded on the highway — a safety violation and a potential fine.

**With TransitOps:** The trip creation form validates cargo weight against the vehicle's Maximum Load Capacity in real time. 650 kg > 500 kg → the system blocks dispatch before the trip is ever created.

---

### Scenario 2 — The Driver With an Expired License

A driver named Rakesh is scheduled for a same-day trip, but his license expired four days ago.

**Without TransitOps:** The expiry date lives in a paper file the Safety Officer checks once a month. Rakesh drives anyway.

**With TransitOps:** Rakesh's status is checked automatically at the point of assignment. An expired license (or a `Suspended` status) removes him from the driver selection pool entirely — he simply cannot be assigned.

---

### Scenario 3 — The Vehicle That Was Supposed to Be in the Shop

A vehicle is due for an oil change, but a dispatcher accidentally tries to send it out on a trip.

**Without TransitOps:** The maintenance log and the dispatch sheet are two different files that never talk to each other.

**With TransitOps:** The moment a maintenance record is created for that vehicle, its status automatically flips to `In Shop`, which instantly removes it from the dispatch/driver selection pool — no manual double-checking required.

---

### Scenario 4 — Knowing the Real Cost of a Vehicle

The Financial Analyst wants to know whether Van-05 is actually profitable.

**Without TransitOps:** Fuel receipts, toll slips, and a maintenance invoice are gathered manually from three sources at month-end.

**With TransitOps:** Every fuel log and expense entry against Van-05 rolls up automatically into its Operational Cost, and the Reports module computes its **Vehicle ROI** on demand:

```
Vehicle ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
```

---

## Platform Choice: Single Responsive Web App with RBAC

Unlike a rider-facing product, every TransitOps user — Fleet Manager, Driver, Safety Officer, Financial Analyst — works at a desk or on a tablet inside an operations office or yard, not on the move making split-second taps. A single **responsive web application** with **role-based views** is the right shape here:

- One codebase, one dataset, one source of truth.
- Role-Based Access Control determines what each login can see and do — a Driver cannot edit acquisition cost; a Financial Analyst cannot dispatch a trip.
- Responsive layout means it works equally well on a dispatcher's desktop monitor and a Safety Officer's tablet during a yard inspection.

---

## Application Workflow

### Trip Lifecycle

```
Draft → Dispatched → Completed → Cancelled
```

**Step 1 — Create Trip (Draft)**
Select source, destination, an *available* vehicle, an *available* driver, cargo weight, and planned distance.

**Step 2 — Validation (automatic)**
System checks, in order:
- Vehicle is not `Retired` or `In Shop`
- Driver's license is valid and status is not `Suspended`
- Neither vehicle nor driver is already `On Trip`
- Cargo weight ≤ vehicle's Maximum Load Capacity

Any failed check blocks the trip from being dispatched.

**Step 3 — Dispatch**
Trip moves to `Dispatched`. Vehicle and Driver statuses automatically flip to `On Trip`.

**Step 4 — Completion or Cancellation**
- **Completed:** Final odometer and fuel consumed are logged. Vehicle and Driver automatically return to `Available`.
- **Cancelled:** Vehicle and Driver automatically restored to `Available`.

**Step 5 — Reports Refresh**
Fuel Efficiency, Operational Cost, and Fleet Utilization recompute using the latest trip and fuel log data.

---

### Role-Based Dashboard Views

| Role | Primary View |
|---|---|
| **Fleet Manager** | Fleet-wide KPIs — Active/Available Vehicles, Vehicles in Maintenance, Fleet Utilization (%) — plus filters by vehicle type, status, and region. |
| **Dispatcher** | Trip creation screen and a live view of active/pending trips they are assigned to or dispatching. |
| **Safety Officer** | Driver roster with license expiry dates, safety scores, and current status (`Available` / `On Trip` / `Off Duty` / `Suspended`) flagged for compliance risk. |
| **Financial Analyst** | Reports & Analytics — Fuel Efficiency, Operational Cost, and Vehicle ROI, exportable to CSV. |

---

## Mandatory Business Rules

| # | Rule |
|---|---|
| 1 | Vehicle registration number must be unique. |
| 2 | Retired or In Shop vehicles must never appear in the dispatch selection. |
| 3 | Drivers with expired licenses or Suspended status cannot be assigned to trips. |
| 4 | A driver or vehicle already marked On Trip cannot be assigned to another trip. |
| 5 | Cargo Weight must not exceed the vehicle's maximum load capacity. |
| 6 | Dispatching a trip automatically changes both the vehicle and driver status to On Trip. |
| 7 | Completing a trip automatically changes both the vehicle and driver status back to Available. |
| 8 | Cancelling a dispatched trip restores the vehicle and driver to Available. |
| 9 | Creating an active maintenance record automatically changes vehicle status to In Shop. |
| 10 | Closing maintenance restores the vehicle to Available (unless retired). |

---

## Reports & Analytics — Formulas

| Metric | Formula |
|---|---|
| **Fuel Efficiency** | Distance ÷ Fuel |
| **Fleet Utilization** | (Vehicles On Trip ÷ Total Active Vehicles) × 100 |
| **Operational Cost** | Fuel Cost + Maintenance Cost (per vehicle) |
| **Vehicle ROI** | (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost |

CSV export is supported for all reports; PDF export is a bonus feature.

---

## Database Entities

| Entity | Key Fields |
|---|---|
| **Users** | Email, password (hashed), role |
| **Roles** | Fleet Manager, Driver, Safety Officer, Financial Analyst |
| **Vehicles** | Registration Number (unique), Name/Model, Type, Max Load Capacity, Odometer, Acquisition Cost, Status (`Available` / `On Trip` / `In Shop` / `Retired`) |
| **Drivers** | Name, License Number, License Category, License Expiry Date, Contact Number, Safety Score, Status (`Available` / `On Trip` / `Off Duty` / `Suspended`) |
| **Trips** | Source, Destination, Vehicle, Driver, Cargo Weight, Planned Distance, Status (`Draft` / `Dispatched` / `Completed` / `Cancelled`) |
| **Maintenance Logs** | Vehicle, Service Type, Open/Close Status, Cost |
| **Fuel Logs** | Vehicle, Liters, Cost, Date |
| **Expenses** | Vehicle, Type (Toll / Other), Amount, Date |

---

## Example Workflow (End-to-End)

| Step | Action | Resulting State |
|---|---|---|
| 1 | Register vehicle `Van-05`, max capacity 500 kg | Status = Available |
| 2 | Register driver `Alex` with a valid license | Driver = Available |
| 3 | Create a trip with Cargo Weight = 450 kg | 450 kg ≤ 500 kg → validation passes |
| 4 | Dispatch the trip | Vehicle & Driver → On Trip |
| 5 | Complete the trip (enter final odometer + fuel consumed) | Vehicle & Driver → Available |
| 6 | Create a maintenance record (e.g., Oil Change) | Vehicle → In Shop, hidden from dispatch |
| 7 | Reports refresh | Operational cost & fuel efficiency recomputed from the latest trip and fuel log |

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React.js (Vite) | Component-driven UI, fastest to build role-based dashboards with, huge ecosystem |
| Backend | Node.js + Express | Lightweight REST API, minimal boilerplate, easy to scaffold within an 8-hour window |
| Database | MongoDB | Document store — flexible schema, fast to iterate on during a hackathon, no migration overhead when fields change |
| ODM | Mongoose | Schema validation and model layer on top of MongoDB, keeps status-enum and relationship logic enforced in code |
| Auth | JWT-based email/password auth | Stateless, simple to implement RBAC middleware around |
| Charts | Recharts | React-native charting for dashboard KPIs and analytics visualizations |
| Hosting | Vercel (frontend) + Render (backend) + MongoDB Atlas (database) | Free tier across the board, zero DevOps overhead for an 8-hour build |

**Total infrastructure cost: ₹0** (all free-tier services).

---

## Local Development Setup

### 1. Prerequisites
- **Node.js (v18+) & npm**
- **MongoDB** — either a local instance or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- **Git**

### 2. Clone the Repository
```bash
git clone <your-repo-url>
cd transitops
```

### 3. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/` with:
```
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-secret-key>
PORT=5000
```
Seed demo data, then start the server:
```bash
npm run seed
npm run dev
```
The API will be live at `http://localhost:5000`.

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Login
Use the seeded demo credentials to explore role-specific dashboards:
- **Fleet Manager**: `manager@transitops.in` / `password123`
- **Dispatcher**: `dispatcher@transitops.in` / `password123`
- **Safety Officer**: `safety@transitops.in` / `password123`
- **Financial Analyst**: `analyst@transitops.in` / `password123`

---

## Demo Flow

A 5-minute walkthrough to demonstrate the complete TransitOps lifecycle:

**1. Register Assets (Fleet Manager)**
Log in as Fleet Manager → register a vehicle (`Van-05`, 500 kg capacity) → register a driver (`Alex`) with a valid license.

**2. Attempt an Overloaded Trip (Dispatcher)**
Log in as Dispatcher → try creating a trip with cargo weight above 500 kg → system blocks it, demonstrating the cargo-capacity rule.

**3. Dispatch a Valid Trip (Dispatcher)**
Create a trip with 450 kg cargo → dispatch it → observe both Vehicle and Driver flip to `On Trip` in real time on the Fleet Manager's dashboard.

**4. Attempt to Reassign a Busy Asset (Dispatcher)**
Try assigning the same vehicle or driver to a second trip → system blocks it, since both are already `On Trip`.

**5. Complete the Trip and Trigger Maintenance (Fleet Manager)**
Complete the trip (Vehicle & Driver → `Available`) → create a maintenance record for the same vehicle → watch it disappear from the dispatch pool as its status flips to `In Shop`.

**6. Review the Numbers (Financial Analyst)**
Log in as Financial Analyst → view Fuel Efficiency, Operational Cost, and Vehicle ROI for `Van-05`, updated from the trip and fuel log just created → export the report to CSV.

---

## Assumptions & Scope

### Assumptions

| Assumption | Detail |
|---|---|
| Single organization | The platform is scoped to one organization's fleet, not a multi-tenant SaaS. |
| Manual data entry | Odometer, fuel, and expense figures are entered by users, not pulled from IoT/telematics hardware. |
| Regional scope | "Region" is treated as a free-text/enum field for filtering, without live GPS tracking. |
| Revenue input | Revenue (for ROI calculation) is entered manually per vehicle/trip, since the spec does not define an automated revenue source. |

### Out of Scope

| Excluded | Reason |
|---|---|
| Live GPS/telematics tracking | Not part of the mandatory or bonus feature list |
| Multi-organization / tenant support | Single fleet operator scope only |
| Native mobile app | Spec calls for a responsive web interface |

### Future Scope

| Area | Detail |
|---|---|
| Telematics integration | Auto-capture odometer and location instead of manual entry |
| Predictive maintenance | Flag vehicles likely to need service based on usage patterns |
| Route optimization | Suggest optimal source-destination routing at trip creation |
| Multi-tenant support | Extend the platform to serve multiple fleet operators |

---

## Mockup / Design Reference

Excalidraw wireframe: [View Mockup](https://link.excalidraw.com/l/65VNwvy7c4X/1FHGDNgD2td)

---

<p align="center">Built to replace the spreadsheet — one status transition, one business rule, one dashboard at a time. 🚛</p>