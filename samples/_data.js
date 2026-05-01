// Shared sample dataset — a small employee directory used across demos.

const FIRST = ['Ada', 'Linus', 'Grace', 'Alan', 'Margaret', 'Donald', 'Edsger', 'Barbara', 'Ken', 'Bjarne',
    'Brendan', 'Guido', 'James', 'Anders', 'Yukihiro', 'John', 'Dennis', 'Brian', 'Niklaus', 'Tony',
    'Rich', 'Joe', 'Martin', 'Kent', 'Robert', 'David', 'Larry', 'Rasmus', 'Jose', 'Mitchell',
    'Sandi', 'Audrey', 'Tracy', 'Vint', 'Tim', 'Sergey', 'Larry', 'Marissa', 'Sheryl', 'Susan'];

const LAST = ['Lovelace', 'Torvalds', 'Hopper', 'Turing', 'Hamilton', 'Knuth', 'Dijkstra', 'Liskov',
    'Thompson', 'Stroustrup', 'Eich', 'Rossum', 'Gosling', 'Hejlsberg', 'Matsumoto', 'McCarthy',
    'Ritchie', 'Kernighan', 'Wirth', 'Hoare', 'Hickey', 'Armstrong', 'Fowler', 'Beck', 'Martin',
    'Heinemeier', 'Page', 'Lerdorf', 'Valim', 'Hashimoto', 'Metz', 'Tang', 'Chou', 'Cerf',
    'Berners-Lee', 'Brin', 'Ellison', 'Mayer', 'Sandberg', 'Wojcicki'];

const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Sales', 'Marketing', 'Operations', 'Finance', 'Support'];
const ROLES = {
    Engineering: ['Engineer', 'Senior Engineer', 'Staff Engineer', 'Engineering Manager'],
    Design: ['Designer', 'Senior Designer', 'Design Lead'],
    Product: ['PM', 'Senior PM', 'Group PM'],
    Sales: ['AE', 'Senior AE', 'Sales Manager'],
    Marketing: ['Marketer', 'Marketing Lead', 'Brand Manager'],
    Operations: ['Ops Specialist', 'Ops Manager'],
    Finance: ['Analyst', 'Senior Analyst', 'Controller'],
    Support: ['Support Rep', 'Support Lead']
};
const LOCATIONS = ['San Francisco', 'New York', 'London', 'Berlin', 'Tokyo', 'Singapore', 'Sydney', 'Toronto', 'Amsterdam', 'Paris'];
const STATUSES = ['Active', 'Active', 'Active', 'Active', 'On Leave', 'Remote'];

function rand(arr, seed) {
    return arr[seed % arr.length];
}

function mulberry32(a) {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

export function generateEmployees(count = 200) {
    const rng = mulberry32(42);
    const rows = [];
    for (let i = 0; i < count; i++) {
        const first = FIRST[Math.floor(rng() * FIRST.length)];
        const last = LAST[Math.floor(rng() * LAST.length)];
        const dept = DEPARTMENTS[Math.floor(rng() * DEPARTMENTS.length)];
        const roleList = ROLES[dept];
        const role = roleList[Math.floor(rng() * roleList.length)];
        const location = LOCATIONS[Math.floor(rng() * LOCATIONS.length)];
        const status = STATUSES[Math.floor(rng() * STATUSES.length)];
        const salary = 50000 + Math.floor(rng() * 200000);
        const hired = `20${10 + Math.floor(rng() * 15)}-${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rng() * 28)).padStart(2, '0')}`;
        const remote = rng() > 0.6;
        const performance = (1 + rng() * 4).toFixed(1);
        rows.push({
            id: `EMP-${String(1000 + i)}`,
            name: `${first} ${last}`,
            email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
            department: dept,
            role: role,
            location: location,
            status: status,
            salary: salary,
            performance: parseFloat(performance),
            hired: hired,
            remote: remote,
            notes: ''
        });
    }
    return rows;
}

export const EMPLOYEE_FIELDS = ['id', 'name', 'email', 'department', 'role', 'location',
    'status', 'salary', 'performance', 'hired', 'remote', 'notes'];

export const EMPLOYEE_OPTIONS = {
    departments: DEPARTMENTS,
    roles: ROLES,
    locations: LOCATIONS,
    statuses: ['Active', 'On Leave', 'Remote']
};
