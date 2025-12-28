import { Router } from 'express';
import { logInteraction } from '../utils/logger.js';
import {
  employees,
  getEmployeeById,
  filterEmployees,
  getDepartments,
  getWilayas
} from '../../data/employees.data.js'


const router = Router();

router.get('/status', (req, res) => {
  res.json({
    status: "operational",
    node: "Algiers-DZ-05",
    database: "connected",
    uptime: "142d 12h 4m"
  });
});

router.get('/employees', (req, res) => {
  logInteraction(req, "API_QUERY: list Emplyess");

  try {
    const { deparment, status, wilaya, search } = req.query;

    if ( !deparment && !status && !wilaya && !search ) {
      return res.json({
        success: true,
        count: 160,
        data: employees
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch employees"
    })
  }
})

router.get('/employees/:id', (req, res) => {
  const { id } = req.params;
  logInteraction(req, `API_PROBE: Employee ID ${id}`)

  try {
    const employee = getEmployeeById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: `Employee with ID ${id} not found`
      })
    }
    
    res.json({
      success: true,
      data: employee
    })
  }catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch employee"
    })
  }
})

export default router;