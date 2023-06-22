const fs = require("fs");
const csvParser = require("csv-parser");

interface Employee {
  Employee_Name: string;
  Employee_EmailID: string;
}

interface SecretSantaAssignment {
  Employee_Name: string;
  Employee_EmailID: string;
  Secret_Child_Name: string;
  Secret_Child_EmailID: string;
}

const parseCSV = async (filePath: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const employees: Employee[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data: any) => {
        employees.push(data);
      })
      .on("end", () => {
        resolve(employees);
      })
      .on("error", (error: any) => {
        reject(error);
      });
  });
};

const getRandomIndex = (max: number, exclude?: number): number => {
  let index = Math.floor(Math.random() * max);
  if (exclude !== undefined && index >= exclude) {
    index++;
  }
  return index;
};

const assignSecretChildren = async (
  employees: Employee[],
  previousAssignments: SecretSantaAssignment[]
): Promise<SecretSantaAssignment[]> => {
  const assignments: SecretSantaAssignment[] = [];
  const usedIndexes: number[] = [];
  for (let i = 0; i < employees.length; i++) {
    const previousChildren = previousAssignments.filter(
      (assignment) =>
        assignment.Employee_Name === employees[i].Employee_Name &&
        assignment.Employee_EmailID === employees[i].Employee_EmailID
    );

    let currentAssignment: SecretSantaAssignment = {
      ...employees[i],
      Secret_Child_Name: "",
      Secret_Child_EmailID: "",
    };
    const excludedPreviousIndexes: any[] = [];
    employees.forEach((employee, index) => {
      previousChildren.forEach((child) => {
        if (
          employee.Employee_Name === child.Secret_Child_Name &&
          employee.Employee_EmailID === child.Secret_Child_EmailID
        ) {
          excludedPreviousIndexes.push(index);
        }
      });
    });

    const excludedIndexes: any[] = employees.map((employee, index) => {
      if (index == i || excludedPreviousIndexes.includes(index)) {
        return index;
      }
    });

    const availableIndexes = employees
      .map((_, index) => index)
      .filter((index) => !excludedIndexes.includes(index));

    const randomIndex = getRandomIndex(availableIndexes.length);
    const secretChildIndex = availableIndexes[randomIndex];
    const secretChild = employees[secretChildIndex];

    currentAssignment.Secret_Child_Name = secretChild.Employee_Name;
    currentAssignment.Secret_Child_EmailID = secretChild.Employee_EmailID;
    assignments.push(currentAssignment);
    usedIndexes.push(secretChildIndex);
  }

  return assignments;
};

const generateCSV = async (
  assignments: SecretSantaAssignment[],
  filePath: string
): Promise<void> => {
  const stream = fs.createWriteStream(filePath);

  stream.write(
    "Employee_Name,Employee_EmailID,Secret_Child_Name,Secret_Child_EmailID\n"
  );

  assignments.forEach((assignment) => {
    stream.write(
      `${assignment.Employee_Name},${assignment.Employee_EmailID},${assignment.Secret_Child_Name},${assignment.Secret_Child_EmailID}\n`
    );
  });

  stream.on("finish", () => {
    return;
  });

  stream.on("error", (error: any) => {
    throw error;
  });

  stream.end();
};

const main = async () => {
  try {
    const employees = await parseCSV("Employee-List.csv");
    const previousAssignments = await parseCSV(
      "Secret-Santa-Game-Result-2023.csv"
    );

    const assignments = await assignSecretChildren(
      employees,
      previousAssignments
    );
    console.log("assignments", assignments);
    await generateCSV(assignments, "New_Assignments.csv");
    console.log("Secret Santa assignments generated successfully!");
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

main();
